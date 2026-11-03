CREATE INDEX orders_cart_created_idx ON orders (cart_id, created_at DESC, id DESC);
