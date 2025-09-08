from pydantic import BaseModel
from typing import List, Optional


class CreateGameBody(BaseModel):
    name: str
    description: Optional[str] = None
    category_id: Optional[int] = None


class AddTagsBody(BaseModel):
    tag_names: List[str]


class AddRolesBody(BaseModel):
    role_ids: List[str]


class CreateCategoryBody(BaseModel):
    name: str


class AddCategoryToGameBody(BaseModel):
    category_id: int


class UpdateGameBody(BaseModel):
    name: str
    description: str
    category_id: str
    tag_ids: List[int]
    role_ids: List[str]


class CreateTagBody(BaseModel):
    name: str
