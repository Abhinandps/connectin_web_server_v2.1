// connection-request.dto.ts
import { IsString } from 'class-validator';

export class ConnectionRequestDto {
  @IsString()
  readonly userId: string;
}
