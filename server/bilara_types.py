from typing import TypedDict

class Segment(TypedDict):  
    segmentId: str
    field: str
    value: str

class SegmentUpdate(Segment):
    oldValue: str
    
"""
  
          return {
            "login": config.LOCAL_LOGIN,
            "name": config.LOCAL_USERNAME,
            "email": config.LOCAL_EMAIL,
            "avatar_url": "",
        }
"""
class User(TypedDict):
    login: str
    name: str
    email: str
    avatar_url: str


