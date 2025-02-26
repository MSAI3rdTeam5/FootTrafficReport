"""rollback cctv_info

Revision ID: c1d9be19bac8
Revises: bbe4fc7674a5
Create Date: 2025-02-25 23:14:27.767909

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c1d9be19bac8'
down_revision: Union[str, None] = 'bbe4fc7674a5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('cctv_info', sa.Column('location', sa.String(length=100), nullable=True))
    op.drop_column('cctv_info', 'type')
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('cctv_info', sa.Column('type', sa.VARCHAR(length=20), autoincrement=False, nullable=True))
    op.drop_column('cctv_info', 'location')
    # ### end Alembic commands ###
