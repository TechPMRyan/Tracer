import { Controller, Get, Post, Put, Delete } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne() {
    return this.userService.findOne();
  }

  @Post()
  create() {
    return this.userService.create();
  }

  @Put(':id')
  update() {
    return this.userService.update();
  }

  @Delete(':id')
  remove() {
    return this.userService.remove();
  }
}
