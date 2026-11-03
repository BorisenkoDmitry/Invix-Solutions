CREATE TABLE products (
 id uuid PRIMARY KEY, name varchar(200) NOT NULL, description varchar(4000) NOT NULL,
 category varchar(80) NOT NULL, price integer NOT NULL CHECK(price > 0),
 stock integer NOT NULL CHECK(stock >= 0), image_key varchar(200)
);
CREATE TABLE carts (
 id uuid PRIMARY KEY, token_hash varchar(64) NOT NULL UNIQUE,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE cart_items (
 cart_id uuid REFERENCES carts(id) ON DELETE CASCADE,
 product_id uuid REFERENCES products(id), quantity integer NOT NULL CHECK(quantity BETWEEN 1 AND 99),
 PRIMARY KEY(cart_id, product_id)
);
CREATE TABLE orders (
 id uuid PRIMARY KEY, cart_id uuid NOT NULL REFERENCES carts(id), idempotency_key uuid NOT NULL,
 fingerprint varchar(64) NOT NULL, customer jsonb NOT NULL, items jsonb NOT NULL,
 total integer NOT NULL CHECK(total > 0), created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(cart_id, idempotency_key)
);
CREATE TABLE telegram_updates (
 update_id bigint PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now()
);
