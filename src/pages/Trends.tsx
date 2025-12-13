import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

const Trends = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">血壓趨勢</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <TrendingUp className="h-12 w-12 mb-4" />
          <p>趨勢圖表即將推出</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default Trends;
