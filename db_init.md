# 数据库集合建议结构

## ⚠️ 首次部署：必须先初始化数据库

> 若跳过此步骤，所有云函数将返回 `DATABASE_COLLECTION_NOT_EXIST` 错误。

### 方式一：调用 `setupCollections` 云函数（推荐）

1. 在微信开发者工具 → 云开发控制台 → 云函数，部署 `setupCollections`
2. 点击"云端测试"，使用管理员账号调用，入参为空 `{}`
3. 返回 `"success": true` 即表示所有集合就绪

> 注意：调用前请确保当前小程序用户在 `users` 集合中存在且 `isAdmin: true`。如果是全新部署，可在方式二手动创建 users 集合和管理员记录后再调用。

### 方式二：控制台手动创建（全新部署）

在微信云开发控制台 → 数据库 页面，依次点击"+"新建以下集合：

| 集合名 | 说明 |
|--------|------|
| `users` | 用户信息（注册、审批、登录） |
| `loginCodes` | 手机验证码 |
| `segmentCounters` | 踏勘岸段编号计数器 |
| `scoutSegments` | 现场踏勘记录 |
| `surveyStations` | 现场调查测站记录 |

创建完成后，在 `users` 集合添加第一条管理员记录：
```json
{
  "mobile": "13800000000",
  "company": "管理单位",
  "name": "管理员",
  "password": "请修改为安全密码",
  "approved": true,
  "forceChangePassword": true,
  "isAdmin": true,
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

---

## 字段结构参考

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
