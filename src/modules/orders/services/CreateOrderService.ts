import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const checkUserExists = await this.customersRepository.findById(
      customer_id,
    );

    if (!checkUserExists) {
      throw new AppError('Customer doesn´t exists!', 400);
    }

    const existsProducts = await this.productsRepository.findAllById(products);

    if (!existsProducts.length) {
      throw new AppError('Product doesn´t exists!', 400);
    }

    const existsProductsIds = existsProducts.map(item => item.id);

    const checkInexistentIds = products.filter(
      item => !existsProductsIds.includes(item.id),
    );

    if (checkInexistentIds.length) {
      throw new AppError(
        'Product doesn´t exists!' + `Product: ${checkInexistentIds[0].id}`,
        401,
      );
    }

    const findProductWithoutQtde = products.filter(
      item =>
        existsProducts.filter(p => p.id === item.id)[0].quantity <
        item.quantity,
    );

    if (findProductWithoutQtde.length) {
      throw new AppError(
        'Product doesn´t have enough quantity!' +
          `Product: ${findProductWithoutQtde[0].id} and quantity: ${findProductWithoutQtde[0].quantity}`,
        400,
      );
    }

    const serializedProducts = products.map(product => ({
      product_id: product.id,
      quantity: product.quantity,
      price: existsProducts.filter(item => item.id === product.id)[0].price,
    }));

    const newOrder = await this.ordersRepository.create({
      customer: checkUserExists,
      products: serializedProducts,
    });

    const orderedProductsQuantity = products.map(product => ({
      id: product.id,
      quantity: product.quantity,
    }));

    await this.productsRepository.updateQuantity(orderedProductsQuantity);

    return newOrder;
  }
}

export default CreateOrderService;
