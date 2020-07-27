import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    const item = {
      id: product.id,
      name,
      price,
      quantity,
    } as Product;

    return item;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const findProduct = await this.ormRepository.findOne({
      where: {
        name,
      },
    });

    return findProduct;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const productIds = products.map(product => product.id);

    const findProducts = await this.ormRepository.findByIds(productIds);

    return findProducts;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    products.map(product => {
      this.ormRepository.decrement(
        { id: product.id },
        'quantity',
        product.quantity,
      );

      return product;
    });

    const items = await this.ormRepository.findByIds(
      products.map(prod => prod.id),
    );

    return items;
  }
}

export default ProductsRepository;
