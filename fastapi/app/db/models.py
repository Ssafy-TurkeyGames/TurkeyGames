from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from app.db.database import Base


class TurkeyDiceSetting(Base):
    __tablename__ = "turkey_dice_setting"

    id = Column(Integer, primary_key=True)  # INT PRIMARY KEY
    people = Column(Integer, nullable=False)
    map = Column(Integer, nullable=False)
    voice = Column(Integer, nullable=False)


class ScoreTableYacht(Base):
    __tablename__ = "turkey_dice_score"  # 테이블 이름 변경

    id = Column(Integer, primary_key=True)  # INT PRIMARY KEY
    ace = Column(Integer, nullable=False, default=0)
    dual = Column(Integer, nullable=False, default=0)
    triple = Column(Integer, nullable=False, default=0)
    quad = Column(Integer, nullable=False, default=0)
    penta = Column(Integer, nullable=False, default=0)
    hexa = Column(Integer, nullable=False, default=0)  # poker 대신 hexa 사용
    bonus_available = Column(Boolean, nullable=False, default=False)  # INT가 아닌 BOOLEAN
    chance = Column(Integer, nullable=False, default=0)
    poker = Column(Integer, nullable=False, default=0)  # poker가 있음
    full_house = Column(Integer, nullable=False, default=0)
    small_straight = Column(Integer, nullable=False, default=0)
    large_straight = Column(Integer, nullable=False, default=0)
    turkey = Column(Integer, nullable=False, default=0)

class ScoreTableYachtAvailable(Base):
    __tablename__ = "turkey_dice_score_available"

    id = Column(Integer, primary_key=True)
    ace = Column(Boolean, nullable=False, default=False)
    dual = Column(Boolean, nullable=False, default=False)
    triple = Column(Boolean, nullable=False, default=False)
    quad = Column(Boolean, nullable=False, default=False)
    penta = Column(Boolean, nullable=False, default=False)
    hexa = Column(Boolean, nullable=False, default=False)
    chance = Column(Boolean, nullable=False, default=False)
    poker = Column(Boolean, nullable=False, default=False)
    full_house = Column(Boolean, nullable=False, default=False)
    small_straight = Column(Boolean, nullable=False, default=False)
    large_straight = Column(Boolean, nullable=False, default=False)
    turkey = Column(Boolean, nullable=False, default=False)

class FiveSecSetting(Base):
    __tablename__ = "five_sec_setting"

    id = Column(Integer, primary_key=True)
    people = Column(Integer, nullable=False)
    round = Column(Integer, nullable=False)
    voice = Column(Integer, nullable=False)

class FiveSecScore(Base):
    __tablename__ = "five_sec_score"

    id = Column(Integer, primary_key=True)  # INT PRIMARY KEY
    score = Column(Integer, nullable=False)