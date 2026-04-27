import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserData,
} from './decorators/current-user.decorator';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeStatusDto } from './dto/update-employee-status.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── Registro ──────────────────────────────────────────────────────────────

  @Post('sign-up')
  @ApiOperation({
    summary: 'Registrar novo usuário',
    description:
      'Cria um novo usuário no sistema. Após o cadastro o usuário deverá realizar login pelo fluxo de OTP.',
  })
  @ApiCreatedResponse({ description: 'Usuário criado com sucesso' })
  async signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  // ── Login por OTP ─────────────────────────────────────────────────────────

  @HttpCode(HttpStatus.OK)
  @Post('sign-in')
  @ApiOperation({
    summary: 'Solicitar código OTP por e-mail',
    description:
      'Envia um código OTP de 6 dígitos para o e-mail informado. O código é válido por 10 minutos. Use `POST /auth/verify-otp` para trocar o código pelo JWT.',
  })
  @ApiOkResponse({ description: 'Código OTP enviado para o e-mail' })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado' })
  @ApiBody({ type: SignInDto })
  async signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @Post('verify-otp')
  @ApiOperation({
    summary: 'Verificar OTP e obter token JWT',
    description:
      'Valida o código OTP recebido por e-mail e retorna o token JWT de acesso. Inclua o token no header `Authorization: Bearer <token>` para chamadas autenticadas.',
  })
  @ApiCreatedResponse({
    description: 'OTP válido — retorna accessToken JWT',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'manager@restaurante.com',
          role: 'MANAGER',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Código OTP inválido ou expirado' })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  // ── Funcionários ──────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('employees')
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Listar funcionários do restaurante',
    description:
      'Retorna todos os funcionários (WAITER / USER) vinculados ao restaurante do usuário autenticado.',
  })
  @ApiOkResponse({ description: 'Lista de funcionários' })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou ausente' })
  async getEmployees(@CurrentUser() user: CurrentUserData) {
    return this.authService.listMyEmployees(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('employees')
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Criar funcionário',
    description:
      'Cadastra um novo funcionário (WAITER ou USER) e o vincula automaticamente ao restaurante do usuário autenticado (MANAGER).',
  })
  @ApiCreatedResponse({ description: 'Funcionário criado com sucesso' })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou ausente' })
  @ApiForbiddenResponse({ description: 'Sem permissão para criar funcionários' })
  async createEmployee(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.authService.createEmployee(createEmployeeDto, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('employees/:id/status')
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Ativar / desativar funcionário',
    description: 'Altera o status ativo/inativo de um funcionário pelo ID.',
  })
  @ApiOkResponse({ description: 'Status atualizado com sucesso' })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou ausente' })
  @ApiNotFoundResponse({ description: 'Funcionário não encontrado' })
  async updateEmployeeStatus(
    @Param('id') employeeId: string,
    @Body() updateEmployeeStatusDto: UpdateEmployeeStatusDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.authService.updateEmployeeStatus(
      employeeId,
      updateEmployeeStatusDto,
      user.id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('employees/:id')
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Atualizar dados do funcionário',
    description: 'Atualiza nome, telefone ou função de um funcionário pelo ID.',
  })
  @ApiOkResponse({ description: 'Funcionário atualizado com sucesso' })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou ausente' })
  @ApiNotFoundResponse({ description: 'Funcionário não encontrado' })
  async updateEmployee(
    @Param('id') employeeId: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.authService.updateEmployee(
      employeeId,
      updateEmployeeDto,
      user.id,
    );
  }
}
