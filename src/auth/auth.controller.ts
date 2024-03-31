import { Response } from 'express';

import { Body, Controller, Get, Post, Request, Res, UseGuards } from '@nestjs/common';

import ApiResponse from '../Response';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req, @Res({ passthrough: true }) res: Response) {
    try {
      const response = await this.authService.login(req.user);
      res.cookie('access_token', response.access_token, {
        httpOnly: true,
      });

      return new ApiResponse(200, 'Login successful', {
        user: req.user,
        access_token: response.access_token,
      });
    } catch (err) {
      console.log(err);
      return new ApiResponse(500, 'Internal server error', null);
    }
  }

  @Post('register')
  async register(@Request() req) {
    return this.authService.register(req.body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    try {
      const user = await this.authService.getUser(req.user.userId);

      return new ApiResponse(200, 'User profile', user);
    } catch (err) {
      console.log(err);
      return new ApiResponse(500, 'Internal server error', null);
    }
  }
}
