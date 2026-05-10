from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models import User
from app.repositories.auth_repository import UserRepository
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, UpdateProfileRequest, UserResponse

AVATAR_PALETTE = [
    "#52B6FF",
    "#55D6BE",
    "#F8A45B",
    "#F774A3",
    "#B88CFF",
    "#8FD14F",
]


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.users = UserRepository(db)

    def _pick_avatar_color(self, seed: str) -> str:
        return AVATAR_PALETTE[sum(ord(char) for char in seed) % len(AVATAR_PALETTE)]

    def register(self, payload: RegisterRequest) -> AuthResponse:
        if self.users.get_by_email(payload.email):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Пользователь с таким email уже зарегистрирован")

        normalized_email = payload.email.lower()
        user = self.users.create(
            email=normalized_email,
            name=payload.name.strip(),
            password_hash=hash_password(payload.password),
            avatar_color=self._pick_avatar_color(normalized_email),
        )
        self.db.commit()
        self.db.refresh(user)

        token = create_access_token(str(user.id))
        return AuthResponse(access_token=token, user=UserResponse.model_validate(user))

    def login(self, payload: LoginRequest) -> AuthResponse:
        user = self.users.get_by_email(payload.email)
        if user is None or not verify_password(payload.password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный email или пароль")

        token = create_access_token(str(user.id))
        return AuthResponse(access_token=token, user=UserResponse.model_validate(user))

    def update_profile(self, current_user: User, payload: UpdateProfileRequest) -> UserResponse:
        if payload.email is not None:
            normalized_email = payload.email.lower()
            existing_user = self.users.get_by_email(normalized_email)
            if existing_user is not None and existing_user.id != current_user.id:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Пользователь с таким email уже существует")
            current_user.email = normalized_email
            current_user.avatar_color = self._pick_avatar_color(normalized_email)

        if payload.name is not None:
            current_user.name = payload.name.strip()

        if payload.password is not None:
            current_user.password_hash = hash_password(payload.password)

        self.users.save(current_user)
        self.db.commit()
        self.db.refresh(current_user)
        return UserResponse.model_validate(current_user)
