import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('onibus')
export class OnibusOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  placa: string;

  @Column()
  modelo: string;

  @Column()
  ano: number;

  @Column()
  capacidade: number;
}
