import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class WebChatSessionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  sessionId: string;
}

export class WebChatMessageDto extends WebChatSessionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message: string;
}
