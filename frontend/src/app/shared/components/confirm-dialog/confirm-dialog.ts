import { Component, input, output } from '@angular/core';
import { CLASSE_BTN_PERIGO, CLASSE_BTN_SECUNDARIO } from '../../ui';
import { Modal } from '../modal/modal';

@Component({
  selector: 'app-confirm-dialog',
  imports: [Modal],
  templateUrl: './confirm-dialog.html',
})
export class ConfirmDialog {
  readonly titulo = input.required<string>();
  readonly mensagem = input.required<string>();
  readonly rotuloConfirmar = input('Excluir');
  readonly carregando = input(false);
  readonly confirmado = output<void>();
  readonly cancelado = output<void>();

  protected readonly btnPerigo = CLASSE_BTN_PERIGO;
  protected readonly btnSecundario = CLASSE_BTN_SECUNDARIO;
}
