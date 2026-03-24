import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  findAll() { return this.userRepository.findAll(); }
  findOne() { return this.userRepository.findOne(); }
  create() { return this.userRepository.create(); }
  update() { return this.userRepository.update(); }
  remove() { return this.userRepository.remove(); }
}
