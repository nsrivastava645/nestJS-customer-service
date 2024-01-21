import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Patch,
  Delete,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CreateCustomerDto, LoginDto, UpdateCustomerDto } from './customer.dto';
import { CustomerService } from './customer.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @UsePipes(new ValidationPipe())
  @Post('register')
  async registerCustomer(
    @Body() createCustomerDto: CreateCustomerDto,
  ): Promise<{ message: string }> {
    await this.customerService.registerCustomer(createCustomerDto);
    return { message: 'Registration successful' };
  }

  @UsePipes(new ValidationPipe())
  @Post('login')
  async loginCustomer(
    @Body() loginCredentials: LoginDto,
  ): Promise<{ accessToken: string }> {
    const accessToken = await this.customerService.authenticateCustomer(
      loginCredentials.email,
      loginCredentials.password,
    );
    return { accessToken };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getCustomerProfile(@Req() request): Promise<any> {
    const customerId = request.userId;
    const customer = await this.customerService.getCustomerProfile(customerId);
    return { customer };
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  async updateCustomerProfile(
    @Req() request,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ): Promise<{ message: string }> {
    const customerId = request.userId;
    await this.customerService.updateCustomerProfile(
      customerId,
      updateCustomerDto,
    );
    return { message: 'Profile updated successfully' };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logoutCustomer(@Req() request): Promise<{ message: string }> {
    const customerId = request.userId;
    await this.customerService.logoutCustomer(customerId);
    return { message: 'Logout successful' };
  }

  @Delete(':customerId')
  @UseGuards(JwtAuthGuard)
  async deleteCustomer(
    @Param('customerId') customerId: string,
  ): Promise<{ message: string }> {
    await this.customerService.deleteCustomer(customerId);
    return { message: 'Customer deleted successfully' };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getCustomers() {
    const [customers, totalRecords] = await this.customerService.getCustomers();
    return { customers, totalRecords };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getCustomerById(@Param() param) {
    const { id: customerId } = param;
    const customer = await this.customerService.getCustomerById(customerId);
    return { customer };
  }
}
