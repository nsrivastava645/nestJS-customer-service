import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customer } from './customer.model';
import { CreateCustomerDto, UpdateCustomerDto } from './customer.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Cache } from '@nestjs/cache-manager';
import { ACCESS_TOKEN_TTL } from 'src/const/constants';

@Injectable()
export class CustomerService {
  constructor(
    @InjectModel(Customer.name) private readonly customerModel: Model<Customer>,
    private readonly jwtService: JwtService,
    private readonly cacheManager: Cache,
  ) {}

  async registerCustomer(
    createCustomerDto: CreateCustomerDto,
  ): Promise<Customer> {
    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(createCustomerDto.password, 10);

    const customer = new this.customerModel({
      ...createCustomerDto,
      password: hashedPassword,
    });

    return customer.save();
  }

  async authenticateCustomer(email: string, password: string): Promise<string> {
    const customer = await this.customerModel.findOne({ email }).exec();

    if (!customer || !(await bcrypt.compare(password, customer.password))) {
      throw new NotFoundException('Invalid credentials');
    }

    // Check if the access token is already in the cache
    const cachedAccessToken: string = await this.cacheManager.get(
      `accessToken:${customer._id}`,
    );

    if (cachedAccessToken) {
      return cachedAccessToken;
    }

    // Generate and cache the JWT token
    const accessToken = this.jwtService.sign({
      sub: customer._id.toString(),
      role: customer.role,
    });
    await this.cacheManager.set(
      `accessToken:${customer._id}`,
      accessToken,
      ACCESS_TOKEN_TTL,
    );

    return accessToken;
  }

  async getCustomerProfile(customerId: string): Promise<Customer> {
    return this.customerModel.findById(customerId);
  }

  async getCustomers(): Promise<[Customer[], number]> {
    return Promise.all([
      this.customerModel.find(),
      this.customerModel.countDocuments(),
    ]);
  }

  async getCustomerById(id: string): Promise<Customer> {
    return this.customerModel.findById(id);
  }

  async updateCustomerProfile(
    customerId: string,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer> {
    const customer = await this.customerModel.findById(customerId).exec();

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Update fields if provided
    if (updateCustomerDto.password) {
      customer.password = await bcrypt.hash(updateCustomerDto.password, 10);
    }
    if (updateCustomerDto.email) {
      customer.email = updateCustomerDto.email;
    }

    return customer.save();
  }

  async logoutCustomer(customerId: string): Promise<void> {
    // Remove the access token from the cache upon logout
    await this.cacheManager.del(`accessToken:${customerId}`);
  }

  async deleteCustomer(customerId: string): Promise<void> {
    // Remove the access token from the cache before deleting the customer
    await this.cacheManager.del(`accessToken:${customerId}`);
    await this.customerModel.findByIdAndDelete(customerId).exec();
  }
}
