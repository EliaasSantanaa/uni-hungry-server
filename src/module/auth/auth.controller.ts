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

  @UseGuards(JwtAuthGuard)
  @Get('employees')
  async getEmployees(@CurrentUser() user: CurrentUserData) {
    return this.authService.listMyEmployees(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('employees')
  async createEmployee(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.authService.createEmployee(createEmployeeDto, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('employees/:id/status')
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
