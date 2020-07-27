import { getRepository, Repository } from 'typeorm';

import IOrdersRepository from '@modules/orders/repositories/IOrdersRepository';
import ICreateOrderDTO from '@modules/orders/dtos/ICreateOrderDTO';
import Order from '../entities/Order';

class OrdersRepository implements IOrdersRepository {
  private ormRepository: Repository<Order>;

  constructor() {
    this.ormRepository = getRepository(Order);
  }

  public async create({ customer, products }: ICreateOrderDTO): Promise<Order> {
    const order = await this.ormRepository.create({
      customer,
      order_products: products,
    });

    await this.ormRepository.save(order);

    return order;
  }

  public async findById(id: string): Promise<Order | undefined> {
    const findOrder = await this.ormRepository.findOne(id, {
      relations: ['order_products', 'customer'],
    });

    if (findOrder) {
      delete findOrder.created_at;
      delete findOrder.updated_at;
      delete findOrder.customer.created_at;
      delete findOrder.customer.updated_at;
      delete findOrder.customer_id;
      delete findOrder.id;
      findOrder.order_products.map(item => {
        delete item.created_at;
        delete item.updated_at;
        delete item.order_id;
        delete item.id;
        item.quantity = Number(item.quantity);
        return item;
      });
    }

    return findOrder;
  }
}

export default OrdersRepository;
