"""initial schema

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-03-30 00:00:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


room_role = sa.Enum("owner", "member", name="room_role")
room_status = sa.Enum("active", "archived", name="room_status")
task_status = sa.Enum("backlog", "active", "estimated", name="task_status")
voting_round_status = sa.Enum("voting", "revealed", "cancelled", "finalized", name="voting_round_status")


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("avatar_color", sa.String(length=32), nullable=False),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    op.create_table(
        "deck_presets",
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("code", sa.String(length=64), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("cards", sa.JSON(), nullable=False),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_deck_presets_code"), "deck_presets", ["code"], unique=True)

    op.create_table(
        "rooms",
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("slug", sa.String(length=140), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("status", room_status, nullable=False),
        sa.Column("owner_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("deck_preset_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("current_task_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["deck_preset_id"], ["deck_presets.id"]),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_rooms_slug"), "rooms", ["slug"], unique=True)

    op.create_table(
        "room_participants",
        sa.Column("room_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("role", room_role, nullable=False),
        sa.Column("seat_index", sa.Integer(), nullable=False),
        sa.Column("joined_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(["room_id"], ["rooms.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("room_id", "user_id", name="uq_room_user"),
    )

    op.create_table(
        "tasks",
        sa.Column("room_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_by_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=240), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("status", task_status, nullable=False),
        sa.Column("estimate_value", sa.String(length=32), nullable=True),
        sa.Column("estimated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["room_id"], ["rooms.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_foreign_key("fk_rooms_current_task_id", "rooms", "tasks", ["current_task_id"], ["id"])

    op.create_table(
        "invitation_links",
        sa.Column("room_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_by_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("token", sa.String(length=64), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["room_id"], ["rooms.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_invitation_links_token"), "invitation_links", ["token"], unique=True)

    op.create_table(
        "voting_rounds",
        sa.Column("room_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("task_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("started_by_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("round_index", sa.Integer(), nullable=False),
        sa.Column("status", voting_round_status, nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revealed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(["room_id"], ["rooms.id"]),
        sa.ForeignKeyConstraint(["started_by_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "votes",
        sa.Column("round_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("participant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("value", sa.String(length=32), nullable=False),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["participant_id"], ["room_participants.id"]),
        sa.ForeignKeyConstraint(["round_id"], ["voting_rounds.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("round_id", "participant_id", name="uq_round_participant"),
    )

    op.create_table(
        "voting_results",
        sa.Column("round_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("task_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("finalized_by_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("result_value", sa.String(length=32), nullable=False),
        sa.Column("average_score", sa.Float(), nullable=True),
        sa.Column("consensus", sa.Boolean(), nullable=False),
        sa.Column("votes_count", sa.Integer(), nullable=False),
        sa.Column("distribution", sa.JSON(), nullable=False),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["finalized_by_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["round_id"], ["voting_rounds.id"]),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("round_id", name="uq_result_round"),
    )


def downgrade() -> None:
    op.drop_table("voting_results")
    op.drop_table("votes")
    op.drop_table("voting_rounds")
    op.drop_index(op.f("ix_invitation_links_token"), table_name="invitation_links")
    op.drop_table("invitation_links")
    op.drop_constraint("fk_rooms_current_task_id", "rooms", type_="foreignkey")
    op.drop_table("tasks")
    op.drop_table("room_participants")
    op.drop_index(op.f("ix_rooms_slug"), table_name="rooms")
    op.drop_table("rooms")
    op.drop_index(op.f("ix_deck_presets_code"), table_name="deck_presets")
    op.drop_table("deck_presets")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
    voting_round_status.drop(op.get_bind(), checkfirst=True)
    task_status.drop(op.get_bind(), checkfirst=True)
    room_role.drop(op.get_bind(), checkfirst=True)
    room_status.drop(op.get_bind(), checkfirst=True)
