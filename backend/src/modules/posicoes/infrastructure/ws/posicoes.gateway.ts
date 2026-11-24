import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { PayloadToken } from '../../../auth/domain/token.service.js';
import { TokenService } from '../../../auth/domain/token.service.js';
import { EncerrarCompartilhamentoUseCase } from '../../use-cases/encerrar-compartilhamento.use-case.js';
import { ListarPosicoesUseCase } from '../../use-cases/listar-posicoes.use-case.js';
import type { PosicaoDaFrota } from '../../use-cases/registrar-posicao.use-case.js';
import { RegistrarPosicaoUseCase } from '../../use-cases/registrar-posicao.use-case.js';

const SALA_FROTA = 'frota';
const PERFIS_ENVIO = new Set(['MOTORISTA', 'ADMINISTRADOR']);

type ClienteAutenticado = Socket & { data: { usuario?: PayloadToken } };

@WebSocketGateway({
  namespace: '/posicoes',
  cors: {
    origin: (process.env.CORS_ORIGIN ?? 'http://localhost:4200').split(',').map((origem) => origem.trim()),
  },
})
export class PosicoesGateway implements OnGatewayConnection {
  @WebSocketServer()
  private readonly servidor!: Server;

  constructor(
    private readonly tokens: TokenService,
    private readonly registrarPosicao: RegistrarPosicaoUseCase,
    private readonly listarPosicoes: ListarPosicoesUseCase,
    private readonly encerrarCompartilhamento: EncerrarCompartilhamentoUseCase,
  ) {}

  async handleConnection(cliente: ClienteAutenticado): Promise<void> {
    try {
      const token = lerToken(cliente);
      if (!token) throw new Error('sem token');
      const usuario = await this.tokens.verificar(token);
      cliente.data.usuario = usuario;
      await cliente.join(SALA_FROTA);
      const snapshot = await this.listarPosicoes.executar();
      cliente.emit('posicoes:snapshot', snapshot);
    } catch {
      cliente.emit('posicoes:erro', { mensagem: 'Não autorizado' });
      cliente.disconnect(true);
    }
  }

  transmitirAtualizacao(posicao: PosicaoDaFrota): void {
    this.servidor?.to(SALA_FROTA).emit('posicao:atualizar', posicao);
  }

  transmitirRemocao(onibusId: number): void {
    this.servidor?.to(SALA_FROTA).emit('posicao:remover', { onibusId });
  }

  @SubscribeMessage('posicao:enviar')
  async enviar(
    @ConnectedSocket() cliente: ClienteAutenticado,
    @MessageBody() corpo: { onibusId?: number; latitude?: number; longitude?: number },
  ) {
    const usuario = cliente.data.usuario;
    if (!usuario || !PERFIS_ENVIO.has(usuario.perfil)) {
      return { ok: false, mensagem: 'Você não pode transmitir localização' };
    }
    const onibusId = Number(corpo?.onibusId);
    const latitude = Number(corpo?.latitude);
    const longitude = Number(corpo?.longitude);
    if (!Number.isInteger(onibusId) || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return { ok: false, mensagem: 'Posição inválida' };
    }
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return { ok: false, mensagem: 'Posição inválida' };
    }

    try {
      await this.registrarPosicao.executar(onibusId, usuario.sub, { latitude, longitude });
      const posicao = await this.listarPosicoes.porOnibus(onibusId);
      if (posicao) this.transmitirAtualizacao(posicao);
      return { ok: true };
    } catch (falha) {
      const mensagem = falha instanceof Error ? falha.message : 'Não foi possível registrar a posição';
      return { ok: false, mensagem };
    }
  }

  @SubscribeMessage('posicao:encerrar')
  async encerrar(
    @ConnectedSocket() cliente: ClienteAutenticado,
    @MessageBody() corpo: { onibusId?: number },
  ) {
    const usuario = cliente.data.usuario;
    if (!usuario || !PERFIS_ENVIO.has(usuario.perfil)) {
      return { ok: false, mensagem: 'Você não pode encerrar o compartilhamento' };
    }
    const onibusId = Number(corpo?.onibusId);
    if (!Number.isInteger(onibusId)) return { ok: false, mensagem: 'Ônibus inválido' };

    try {
      await this.encerrarCompartilhamento.executar(onibusId);
      this.transmitirRemocao(onibusId);
      return { ok: true };
    } catch (falha) {
      const mensagem = falha instanceof Error ? falha.message : 'Não foi possível encerrar';
      return { ok: false, mensagem };
    }
  }
}

function lerToken(cliente: Socket): string | null {
  const auth = cliente.handshake.auth as { token?: unknown } | undefined;
  if (typeof auth?.token === 'string' && auth.token.trim()) return auth.token.trim();
  const query = cliente.handshake.query.token;
  if (typeof query === 'string' && query.trim()) return query.trim();
  if (Array.isArray(query) && typeof query[0] === 'string' && query[0].trim()) return query[0].trim();
  const header = cliente.handshake.headers.authorization;
  if (typeof header === 'string' && header.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}
