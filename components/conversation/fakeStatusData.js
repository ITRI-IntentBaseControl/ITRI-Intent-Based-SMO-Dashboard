//FakeStatusColumn
export const fakeData = [
    {
      title: "◉ 文字分析",
      description: "明確的目標與範疇",
      original_text: "我想查看 ITRI 51 館五樓所有 UE 的連線狀態",
      preprocessed:{
        location:"ITRI 51 館五樓",
        subject: "UE",
        scope: "all",
        info_type: "connection_status"
    }
    },
    {
      title: "◉ 意圖分類",
      description: "查找可參考或可套用之既有情境",
      primary_intent:"request_ue_status",
      confidence_score:0.97
    },
    {
      title: "◉ 處理流程",
      description:"詳細意圖流程",
      sub_actions:[
        "查詢指定樓層資訊",
        "整理UE狀態"
      ]
    },
    {
      title: "◉ 執行結果",
      description:"意圖執行結果",
      type:"table",
      data: {
      "ue_count": 12,
      "connected": 10,
      "disconnected": 2
    }
    },
];