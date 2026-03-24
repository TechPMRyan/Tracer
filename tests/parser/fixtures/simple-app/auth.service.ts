import { Injectable } from '@nestjs/common';
import { UserService } from './user.service';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
  ) {}

  login() { return this.userService.findOne(); }
  register() { return this.userService.create(); }
  profile() { return this.tokenService.decode(); }
}
