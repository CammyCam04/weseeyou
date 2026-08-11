"""Initial Partitioned Schema and Hybrid JSONB Tables

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-08-11 02:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Enable PostgreSQL Trigram Extension for Fuzzy Autocomplete Search
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;")

    # 2. Create Master Partitioned Table
    op.execute("""
    CREATE TABLE IF NOT EXISTS official_profiles (
        id                              VARCHAR(64) NOT NULL,
        jurisdiction_branch             VARCHAR(50) NOT NULL,
        bioguide_id                     VARCHAR(32),
        fec_candidate_id                VARCHAR(32),
        
        first_name                      VARCHAR(100) NOT NULL,
        middle_name                     VARCHAR(100),
        last_name                       VARCHAR(100) NOT NULL,
        full_name                       VARCHAR(255) NOT NULL,
        
        current_title                   VARCHAR(150) NOT NULL,
        current_chamber                 VARCHAR(50),
        party                           VARCHAR(50),
        state                           VARCHAR(2) NOT NULL,
        county_name                     VARCHAR(100),
        county_fips                     VARCHAR(5),
        city_name                       VARCHAR(100),
        district                        VARCHAR(50),
        is_active                       BOOLEAN NOT NULL DEFAULT TRUE,
        
        record_hash                     VARCHAR(32),
        
        political_history               JSONB NOT NULL DEFAULT '[]'::jsonb,
        financial_history               JSONB NOT NULL DEFAULT '{}'::jsonb,
        legislative_or_judicial_history JSONB NOT NULL DEFAULT '{}'::jsonb,
        personal_profile                JSONB NOT NULL DEFAULT '{}'::jsonb,
        controversies_and_news          JSONB NOT NULL DEFAULT '[]'::jsonb,
        external_identifiers            JSONB NOT NULL DEFAULT '{}'::jsonb,
        
        created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

        PRIMARY KEY (id, jurisdiction_branch)
    ) PARTITION BY LIST (jurisdiction_branch);
    """)

    # 3. Create Federal Branch Partitions
    op.execute("""
    CREATE TABLE IF NOT EXISTS officials_federal_legislative PARTITION OF official_profiles
        FOR VALUES IN ('federal_legislative');

    CREATE TABLE IF NOT EXISTS officials_federal_judicial PARTITION OF official_profiles
        FOR VALUES IN ('federal_judicial');

    CREATE TABLE IF NOT EXISTS officials_federal_executive PARTITION OF official_profiles
        FOR VALUES IN ('federal_executive');
    """)

    # 4. Create State Branch Partitions
    op.execute("""
    CREATE TABLE IF NOT EXISTS officials_state_legislative PARTITION OF official_profiles
        FOR VALUES IN ('state_legislative');

    CREATE TABLE IF NOT EXISTS officials_state_judicial PARTITION OF official_profiles
        FOR VALUES IN ('state_judicial');

    CREATE TABLE IF NOT EXISTS officials_state_executive PARTITION OF official_profiles
        FOR VALUES IN ('state_executive');
    """)

    # 5. Create Local / County & Municipal Sub-Partitioned Table (By State)
    op.execute("""
    CREATE TABLE IF NOT EXISTS officials_local_county_municipal PARTITION OF official_profiles
        FOR VALUES IN ('local_county_municipal')
        PARTITION BY LIST (state);

    CREATE TABLE IF NOT EXISTS officials_local_tn PARTITION OF officials_local_county_municipal
        FOR VALUES IN ('TN');

    CREATE TABLE IF NOT EXISTS officials_local_fl PARTITION OF officials_local_county_municipal
        FOR VALUES IN ('FL');

    CREATE TABLE IF NOT EXISTS officials_local_ca PARTITION OF officials_local_county_municipal
        FOR VALUES IN ('CA');

    CREATE TABLE IF NOT EXISTS officials_local_tx PARTITION OF officials_local_county_municipal
        FOR VALUES IN ('TX');

    CREATE TABLE IF NOT EXISTS officials_local_default PARTITION OF officials_local_county_municipal
        DEFAULT;
    """)

    # 6. High-Performance Indexes
    op.execute("""
    -- Fuzzy name search across all partitions
    CREATE INDEX IF NOT EXISTS idx_profiles_trgm_name ON official_profiles USING gin (full_name gin_trgm_ops);
    
    -- Local county and FIPS indexes
    CREATE INDEX IF NOT EXISTS idx_local_county_city ON officials_local_county_municipal(state, county_name, city_name);
    CREATE INDEX IF NOT EXISTS idx_local_fips ON officials_local_county_municipal(county_fips);
    
    -- Federal search indexes
    CREATE INDEX IF NOT EXISTS idx_fed_leg_state_party ON officials_federal_legislative(state, party);
    CREATE INDEX IF NOT EXISTS idx_fed_leg_chamber ON officials_federal_legislative(current_chamber);
    
    -- JSONB GIN Indexes
    CREATE INDEX IF NOT EXISTS idx_profiles_fin_gin ON official_profiles USING gin (financial_history);
    CREATE INDEX IF NOT EXISTS idx_profiles_ext_ids ON official_profiles USING gin (external_identifiers);
    """)

    # 7. Create Ingestion Logs Table
    op.create_table(
        'ingestion_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('source_api', sa.String(100), nullable=False),
        sa.Column('job_type', sa.String(100), nullable=False),
        sa.Column('records_synced', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('records_skipped', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('status', sa.String(50), nullable=False, server_default='RUNNING'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('ingestion_logs')
    op.execute("DROP TABLE IF EXISTS official_profiles CASCADE;")
    op.execute("DROP EXTENSION IF EXISTS pg_trgm;")
