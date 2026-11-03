class ShopError(Exception):
    pass


class NotFoundError(ShopError):
    pass


class InvalidImageError(ShopError):
    pass


class StorageUnavailableError(ShopError):
    pass
