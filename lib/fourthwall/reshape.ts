import { Cart, CartItem, Image, Money, Product, ProductVariant } from 'lib/types';
import {
  FourthwallCart,
  FourthwallCartItem,
  FourthwallMoney,
  FourthwallProduct,
  FourthwallProductImage,
  FourthwallProductVariant
} from './types';

const DEFAULT_IMAGE: Image = {
  url: '',
  transformedUrl: '',
  altText: '',
  width: 0,
  height: 0
};

const reshapeMoney = (money: FourthwallMoney): Money => {
  return {
    amount: money.value.toString(),
    currencyCode: money.currency
  };
};

const reshapeImages = (
  images: FourthwallProductImage[] | null | undefined,
  productTitle: string
): Image[] => {
  if (!images?.length) return [];

  return images
    .filter((image) => Boolean(image?.url || image?.transformedUrl))
    .map((image) => {
      const source = image.url || image.transformedUrl;
      const filename = source.match(/.*\/(.*)\..*/)?.[1];
      return {
        url: image.url || image.transformedUrl,
        transformedUrl: image.transformedUrl || image.url,
        width: image.width || 0,
        height: image.height || 0,
        altText: `${productTitle}${filename ? ` - ${filename}` : ''}`
      };
    });
};

const pickFeaturedImage = ({
  thumbnail,
  productImages,
  variants,
  productTitle
}: {
  thumbnail?: Image | null;
  productImages: Image[];
  variants: ProductVariant[];
  productTitle: string;
}): Image => {
  if (thumbnail?.url) {
    return { ...thumbnail, altText: thumbnail.altText || productTitle };
  }

  if (productImages[0]?.url) return productImages[0];

  for (const variant of variants) {
    if (variant.images[0]?.url) {
      return {
        ...variant.images[0],
        altText: variant.images[0].altText || productTitle
      };
    }
  }

  return DEFAULT_IMAGE;
};

export const reshapeProducts = (products: FourthwallProduct[]) => {
  const reshapedProducts = [];

  for (const product of products) {
    if (product) {
      const reshapedProduct = reshapeProduct(product);
      if (reshapedProduct) {
        reshapedProducts.push(reshapedProduct);
      }
    }
  }

  return reshapedProducts;
};

export const reshapeProduct = (product: FourthwallProduct): Product | undefined => {
  if (!product) {
    return undefined;
  }

  const { images, variants, thumbnailImage, ...rest } = product;
  const reshapedVariants = reshapeVariants(variants || []);
  const productImages = reshapeImages(images, product.name);
  const thumbnail = reshapeImages(
    thumbnailImage ? [thumbnailImage] : [],
    product.name
  )[0];
  const featuredImage = pickFeaturedImage({
    thumbnail,
    productImages,
    variants: reshapedVariants,
    productTitle: product.name
  });
  const galleryImages = [
    ...(thumbnail ? [thumbnail] : []),
    ...productImages,
    ...reshapedVariants.flatMap((variant) => variant.images)
  ].filter((image, index, all) => image.url && all.findIndex((item) => item.url === image.url) === index);

  const prices = (variants || []).map((v) => v.unitPrice.value);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const currencyCode = variants?.[0]?.unitPrice.currency || 'USD';

  const attributes = (variants || []).map((v) => v.attributes);
  const sizes = new Set(attributes.filter((a) => !!a?.size).map((v) => v.size?.name));
  const colors = new Set(attributes.filter((a) => !!a?.color).map((v) => v.color?.name));

  return {
    ...rest,
    id: product.id,
    handle: product.slug,
    title: product.name,
    descriptionHtml: product.description,
    description: product.description,
    images: galleryImages.length > 0 ? galleryImages : featuredImage.url ? [featuredImage] : [],
    variants: reshapedVariants,
    priceRange: {
      minVariantPrice: {
        amount: minPrice.toString(),
        currencyCode
      },
      maxVariantPrice: {
        amount: maxPrice.toString(),
        currencyCode
      }
    },
    featuredImage,
    options: [
      {
        id: 'color',
        name: 'Color',
        values: [...colors].filter((c) => !!c) as string[]
      },
      {
        id: 'size',
        name: 'Size',
        values: [...sizes].filter((s) => !!s) as string[]
      }
    ],
    availableForSale: reshapedVariants.some((v) => v.availableForSale),
    tags: [],
    updatedAt: product.updatedAt || new Date().toISOString()
  };
};

const reshapeVariants = (variants: FourthwallProductVariant[]): ProductVariant[] => {
  return variants.map((v) => {
    const inventory = v.stock.type === 'UNLIMITED' ? null : (v.stock.inStock ?? 0);

    return {
      id: v.id,
      title: v.name,
      sku: v.sku || '',
      availableForSale: inventory === null || inventory > 0,
      inventory,
      images: reshapeImages(v.images, v.name),
      selectedOptions: [
        {
          name: 'Size',
          value: v.attributes?.size?.name
        },
        {
          name: 'Color',
          value: v.attributes?.color?.name
        }
      ],
      price: reshapeMoney(v.unitPrice)
    };
  });
};

const reshapeCartItem = (item: FourthwallCartItem): CartItem => {
  const image = item.variant.images?.[0];

  return {
    id: item.variant.id,
    quantity: item.quantity,
    cost: {
      totalAmount: reshapeMoney({
        value: item.variant.unitPrice.value * item.quantity,
        currency: item.variant.unitPrice.currency
      })
    },
    merchandise: {
      id: item.variant.id,
      title: item.variant.name,
      selectedOptions: [],
      product: {
        id: item.variant.product?.id || 'TT',
        handle: item.variant.product?.slug || 'TT',
        title: item.variant.product?.name || 'TT',
        featuredImage: {
          url: image?.url || image?.transformedUrl || '',
          transformedUrl: image?.transformedUrl || image?.url || '',
          altText: item.variant.product?.name || 'TT',
          width: image?.width || 100,
          height: image?.height || 100
        }
      }
    }
  };
};

export const reshapeCart = (cart: FourthwallCart): Cart => {
  const totalValue = cart.items
    .map((item) => item.quantity * item.variant.unitPrice.value)
    .reduce((a, b) => a + b, 0);
  const currencyCode = cart.items[0]?.variant.unitPrice.currency || 'USD';

  return {
    ...cart,
    cost: {
      totalAmount: {
        amount: totalValue.toString(),
        currencyCode
      },
      subtotalAmount: {
        amount: totalValue.toString(),
        currencyCode
      }
    },
    lines: cart.items.map(reshapeCartItem),
    currency: currencyCode,
    totalQuantity: cart.items.map((item) => item.quantity).reduce((a, b) => a + b, 0)
  };
};
