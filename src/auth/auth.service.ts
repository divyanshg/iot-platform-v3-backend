import * as bcrypt from 'bcrypt';

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, User } from '@prisma/clientv2';

import ApiResponse from '../Response';
import { UserService } from '../user/user.service';
import { generateApiKey } from '../utils/lib';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    pass: string,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.usersService.findOne({ email });

    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }

    return null;
  }

  async login(user: {
    id: string;
    email: string;
    organizationId: string | null;
  }) {
    const payload = {
      username: user.email,
      sub: user.id,
      orgId: user.organizationId,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(user: RegisterDto) {
    //check if user already exists
    const userExists = await this.usersService.findOne({ email: user.email });
    if (userExists) {
      return new ApiResponse(400, 'User already exists', null);
    }

    const hashedPassword = await bcrypt.hash(user.password, 10);
    // const apiKey = await generateApiKey(user.email);

    const createdUser = await this.usersService.create({
      ...user,
      password: hashedPassword,
      // apiKey,
    } as Prisma.UserCreateInput);

    return new ApiResponse(201, 'User created successfully', createdUser);
  }

  async getUser(id: string) {
    return this.usersService.findOne({ id });
  }
}
