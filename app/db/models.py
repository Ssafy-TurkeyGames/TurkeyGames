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