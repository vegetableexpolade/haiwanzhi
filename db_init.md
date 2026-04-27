# 数据库集合建议结构

## users
```json
{
  "mobile": "13800000000",
  "company": "某单位",
  "name": "张三",
  "password": "123456",
  "approved": true,
  "forceChangePassword": true,
  "isAdmin": false,
  "_openid": "",
  "createdAt": "Date"
}
```

## loginCodes
```json
{
  "mobile": "13800000000",
  "code": "123456",
  "used": false,
  "createdAt": "Date"
}
```

## segmentCounters
```json
{
  "key": "某海湾-20260410",
  "seq": 3,
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

## scoutSegments
```json
{
  "bayName": "某海湾",
  "recorder": "张三",
  "titleInfo": {
    "bayName": "某海湾",
    "recorder": "张三",
    "timeText": "2026年04月10日 10:00"
  },
  "dateStr": "20260410",
  "segmentNo": "某海湾-20260410-ad01",
  "entries": {
    "geomorphology": {
      "primary": "海蚀地貌",
      "secondary": "海蚀崖",
      "remark": "备注",
      "longitude": "120.123456",
      "latitude": "36.123456",
      "photos": []
    },
    "tidal": {
      "zoneTypeMap": {
        "高潮区": ["岩滩", "盐沼潮间带"],
        "中潮区": ["泥滩"]
      },
      "remark": "备注",
      "longitude": "120.123456",
      "latitude": "36.123456",
      "photos": []
    }
  },
  "submitted": false,
  "createdAt": "Date"
}
```

## surveyStations
```json
{
  "stationNo": "ST01",
  "description": "现场描述",
  "remark": "备注",
  "longitude": "120.123456",
  "latitude": "36.123456",
  "photos": [],
  "titleInfo": {
    "bayName": "某海湾",
    "recorder": "张三"
  },
  "submitted": false,
  "createdAt": "Date"
}
```

## 管理员说明
- 需要导出数据的账号，请在 `users` 集合中加上 `isAdmin: true`
- 推荐只有少量管理员持有该权限


## 第三轮补充
- `users` 集合建议增加字段：
  - `rejectReason`: String，驳回原因
  - `isAdmin`: Boolean，是否管理员
  - `approvedAt`: Date，审批时间
