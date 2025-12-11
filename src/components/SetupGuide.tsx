import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { setAppsScriptUrl } from '@/lib/googleSheets';
import { Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Props {
  onComplete: () => void;
}

const APPS_SCRIPT_CODE = `function doPost(e) {
  const sheet = SpreadsheetApp.openById('1p35EWxhVcYYJurZWEO3yplFn3Lnbn9ERL6DP0UT0DHA').getActiveSheet();
  const data = JSON.parse(e.postData.contents);
  
  if (data.action === 'add') {
    sheet.appendRow([
      data.data.email,
      data.data.date,
      data.data.time,
      data.data.systolic,
      data.data.diastolic,
      data.data.pulse
    ]);
  } else if (data.action === 'update') {
    const row = data.rowIndex;
    sheet.getRange(row, 1, 1, 6).setValues([[
      data.data.email,
      data.data.date,
      data.data.time,
      data.data.systolic,
      data.data.diastolic,
      data.data.pulse
    ]]);
  } else if (data.action === 'delete') {
    sheet.deleteRow(data.rowIndex);
  }
  
  return ContentService.createTextOutput(JSON.stringify({success: true}))
    .setMimeType(ContentService.MimeType.JSON);
}`;

export const SetupGuide = ({ onComplete }: Props) => {
  const [url, setUrl] = useState('');
  const { toast } = useToast();

  const copyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    toast({ title: '已複製代碼' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.includes('script.google.com')) {
      setAppsScriptUrl(url);
      onComplete();
    } else {
      toast({ title: '請輸入有效的 Apps Script URL', variant: 'destructive' });
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>設定 Google Apps Script</CardTitle>
        <CardDescription>
          為了讓 App 可以寫入 Google Sheet，需要部署一個簡單的 Apps Script（約5分鐘）
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <h3 className="font-medium">步驟 1: 開啟 Apps Script</h3>
          <Button variant="outline" asChild>
            <a
              href="https://script.google.com/home/start"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              開啟 Google Apps Script
            </a>
          </Button>
        </div>

        <div className="space-y-3">
          <h3 className="font-medium">步驟 2: 建立新專案，貼上以下代碼</h3>
          <div className="relative">
            <pre className="bg-muted p-4 rounded-md text-xs overflow-auto max-h-48">
              {APPS_SCRIPT_CODE}
            </pre>
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2"
              onClick={copyCode}
            >
              <Copy className="h-4 w-4 mr-1" />
              複製
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-medium">步驟 3: 部署為網頁應用程式</h3>
          <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
            <li>點擊「部署」&gt;「新增部署」</li>
            <li>類型選「網頁應用程式」</li>
            <li>執行身分：選「我」</li>
            <li>存取權限：選「所有人」</li>
            <li>點擊「部署」並授權</li>
            <li>複製產生的網址</li>
          </ol>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <h3 className="font-medium">步驟 4: 貼上部署網址</h3>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/..."
          />
          <Button type="submit" className="w-full">
            完成設定
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
