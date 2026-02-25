import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Redirect,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { SignUpDto } from './dto/sign-up.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  async signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('sign-in')
  async signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  @Get('confirm')
  async confirmEmail(
    @Query('token_hash') tokenHash: string,
    @Query('type') type: string,
    @Query('error') error: string,
    @Query('error_code') errorCode: string,
    @Query('error_description') errorDescription: string,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    // Se já veio com erro do Supabase, redireciona direto
    if (error) {
      const errorMessage = errorDescription || error;
      return `
        <html>
          <head>
            <meta http-equiv="refresh" content="3;url=${frontendUrl}/auth/email-confirmed?success=false&error=${encodeURIComponent(errorMessage)}">
            <style>
              body { font-family: Arial; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
              .box { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
              .error { color: #e53e3e; }
            </style>
          </head>
          <body>
            <div class="box">
              <h2 class="error">❌ Erro na Confirmação</h2>
              <p>${errorDescription || 'Link inválido ou expirado'}</p>
              <p>Redirecionando...</p>
            </div>
          </body>
        </html>
      `;
    }

    // Se não tem token, é um acesso inválido
    if (!tokenHash || !type) {
      return `
        <html>
          <head>
            <meta http-equiv="refresh" content="3;url=${frontendUrl}/auth/email-confirmed?success=false&error=Parâmetros+inválidos">
            <style>
              body { font-family: Arial; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
              .box { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
              .error { color: #e53e3e; }
            </style>
          </head>
          <body>
            <div class="box">
              <h2 class="error">❌ Parâmetros Inválidos</h2>
              <p>Redirecionando...</p>
            </div>
          </body>
        </html>
      `;
    }

    try {
      await this.authService.confirmEmail(tokenHash, type);
      return `
        <html>
          <head>
            <meta http-equiv="refresh" content="2;url=${frontendUrl}/auth/email-confirmed?success=true">
            <style>
              body { font-family: Arial; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
              .box { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
              .success { color: #38a169; }
            </style>
          </head>
          <body>
            <div class="box">
              <h2 class="success">✅ Email Confirmado!</h2>
              <p>Sua conta foi ativada com sucesso.</p>
              <p>Redirecionando para o login...</p>
            </div>
          </body>
        </html>
      `;
    } catch (error) {
      return `
        <html>
          <head>
            <meta http-equiv="refresh" content="3;url=${frontendUrl}/auth/email-confirmed?success=false&error=${encodeURIComponent(error.message)}">
            <style>
              body { font-family: Arial; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
              .box { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
              .error { color: #e53e3e; }
            </style>
          </head>
          <body>
            <div class="box">
              <h2 class="error">❌ Erro na Confirmação</h2>
              <p>${error.message}</p>
              <p>Redirecionando...</p>
            </div>
          </body>
        </html>
      `;
    }
  }
}
