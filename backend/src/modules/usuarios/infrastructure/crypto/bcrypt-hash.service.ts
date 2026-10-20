import { Injectable } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';
import { HashService } from '../../domain/hash.service.js';

@Injectable()
export class BcryptHashService implements HashService {
    private readonly custo = 10;

    gerar(senha: string): Promise<string> {
        return hash(senha, this.custo);
    }

    comparar(senha: string, senhaHash: string): Promise<boolean> {
        return compare(senha, senhaHash);
    }
}