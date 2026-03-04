from pydantic import BaseModel, condecimal
from datetime import date
from typing import Annotated

class api_response(BaseModel):
    success: bool
    message: str

class label_merchant(BaseModel):
    particular: str
    merchant_id: int

class ignore_transaction(BaseModel):
    transaction_ids: List[int]
    ignore: bool

class attach_category(BaseModel):
    transaction_ids: List[int]
    category_id: int

class raw_transaction(BaseModel):
    temp_id: int
    date: date
    particulars: str
    withdrawal: Annotated[Decimal, Field(max_digits=10, decimal_places=2)]
    deposit: Annotated[Decimal, Field(max_digits=10, decimal_places=2)]
    balance: Annotated[Decimal, Field(max_digits=10, decimal_places=2)]

class transaction(BaseModel):
    id: int
    merchant_id: int
    category_id: int
    transaction_type: bool # DR: 0/CR: 1
    description: str
    ignore: bool
    amount: Annotated[Decimal, Field(max_digits=10, decimal_places=2)]
    date: date
    openingBalance: Annotated[Decimal, Field(max_digits=10, decimal_places=2)]
    closingBalance: Annotated[Decimal, Field(max_digits=10, decimal_places=2)]

class category(BaseModel):
    id: int
    string_id: str
    name: str
    description: str
    color: str

class merchant(BaseModel):
    id: int
    string_id: str
    name: str
    description: str
    category_id: int
    ignore: bool
    color: str

class label(BaseModel):
    id: int
    particular: str
    merchant_id: int