import { Contract } from '@algorandfoundation/algorand-typescript'

export class PersonalBank extends Contract {
  public hello(name: string): string {
    return `Hello, ${name}`
  }
}
