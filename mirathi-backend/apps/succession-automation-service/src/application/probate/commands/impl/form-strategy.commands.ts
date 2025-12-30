import { ICommand } from '@nestjs/cqrs';

import {
  GenerateFormBundleDto,
  RegenerateFormsDto,
  ReviewFormDto,
  SignFormDto,
} from '../dtos/form-strategy.dtos';

export class GenerateFormBundleCommand implements ICommand {
  constructor(public readonly dto: GenerateFormBundleDto) {}
}

export class ReviewFormCommand implements ICommand {
  constructor(public readonly dto: ReviewFormDto) {}
}

export class SignFormCommand implements ICommand {
  constructor(public readonly dto: SignFormDto) {}
}

export class RegenerateFormsCommand implements ICommand {
  constructor(public readonly dto: RegenerateFormsDto) {}
}
