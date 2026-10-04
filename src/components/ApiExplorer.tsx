import React, { useState } from 'react';
import { Terminal, Send, Check, Copy, Code, Globe } from 'lucide-react';

interface EndpointDef {
  id: string;
  name: string;
  method: 'GET' | 'POST';
  path: string;
  description: string;
  defaultPayload?: any;
  defaultParams?: Record<string, string | number>;
}

const ENDPOINTS: EndpointDef[] = [
  {
    id: 'current',
    name: 'دریافت تاریخ شمسی جاری',
    method: 'GET',
    path: '/api/jalaali/current',
    description: 'دریافت تاریخ خورشیدی و میلادی امروز همراه با شماره و نام روز هفته',
  },
  {
    id: 'holidays_year',
    name: 'تعطیلات سال جلالی',
    method: 'GET',
    path: '/api/jalaali/holidays/1405',
    description: 'لیست تمام تعطیلات رسمی و مناسبت‌های سال مشخص (ثابت + قمری)',
  },
  {
    id: 'is_holiday',
    name: 'بررسی تعطیلی یک تاریخ',
    method: 'POST',
    path: '/api/jalaali/is-holiday',
    description: 'بررسی اینکه آیا یک روز خاص تعطیل رسمی یا پایان هفته شرکت است',
    defaultPayload: {
      year: 1405,
      month: 1,
      day: 1,
      company_id: 1,
    },
  },
  {
    id: 'j2g',
    name: 'تبدیل جلالی به گرگوری',
    method: 'POST',
    path: '/api/jalaali/convert/jalali-to-gregorian',
    description: 'تبدیل سال، ماه، روز شمسی به معادل تاریخ میلادی ISO-8601',
    defaultPayload: {
      year: 1405,
      month: 1,
      day: 1,
    },
  },
  {
    id: 'g2j',
    name: 'تبدیل گرگوری به جلالی',
    method: 'POST',
    path: '/api/jalaali/convert/gregorian-to-jalali',
    description: 'تبدیل سال، ماه، روز میلادی به معادل تاریخ خورشیدی',
    defaultPayload: {
      year: 2026,
      month: 3,
      day: 21,
    },
  },
  {
    id: 'working_days',
    name: 'محاسبه روزهای کاری ماه',
    method: 'GET',
    path: '/api/jalaali/working-days/1405/1?company_id=1',
    description: 'محاسبه تعداد روزهای کاری، تعطیلات رسمی و پایان هفته‌های یک ماه',
  },
];

export const ApiExplorer: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointDef>(ENDPOINTS[0]);
  const [requestUrl, setRequestUrl] = useState<string>(ENDPOINTS[0].path);
  const [requestBody, setRequestBody] = useState<string>(
    ENDPOINTS[0].defaultPayload ? JSON.stringify(ENDPOINTS[0].defaultPayload, null, 2) : ''
  );
  const [responseOutput, setResponseOutput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusBadge, setStatusBadge] = useState<number | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleSelect = (ep: EndpointDef) => {
    setSelectedEndpoint(ep);
    setRequestUrl(ep.path);
    setRequestBody(ep.defaultPayload ? JSON.stringify(ep.defaultPayload, null, 2) : '');
    setResponseOutput('');
    setStatusBadge(null);
  };

  const handleSendRequest = async () => {
    setIsLoading(true);
    setStatusBadge(null);
    try {
      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (selectedEndpoint.method === 'POST' && requestBody.trim()) {
        options.body = requestBody;
      }

      const res = await fetch(requestUrl, options);
      setStatusBadge(res.status);
      const data = await res.json();
      setResponseOutput(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setResponseOutput(JSON.stringify({ error: err.message || 'Request failed' }, null, 2));
      setStatusBadge(500);
    } finally {
      setIsLoading(false);
    }
  };

  const copyCurl = () => {
    let curl = `curl -X ${selectedEndpoint.method} "http://localhost:3000${requestUrl}"`;
    if (selectedEndpoint.method === 'POST') {
      curl += ` -H "Content-Type: application/json" -d '${requestBody.replace(/\n/g, '')}'`;
    }
    navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex items-center space-x-3 space-x-reverse mb-2">
          <span className="p-2.5 bg-slate-900 text-emerald-400 rounded-xl">
            <Terminal className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              کنسول تست زنده وب‌سرویس‌های RESTful زروان
            </h2>
            <p className="text-xs text-slate-500">
              بر اساس مستندات API ماژول Odoo در فایل‌های <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded font-mono">jalaali_api.py</code> و <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded font-mono">README.md</code>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Endpoints List */}
        <div className="lg:col-span-4 bg-white p-4 rounded-2xl shadow-xs border border-slate-200 space-y-2">
          <span className="text-xs font-semibold text-slate-500 block px-2 mb-2">
            اندپوینت‌های در دسترس:
          </span>
          {ENDPOINTS.map((ep) => {
            const isSelected = selectedEndpoint.id === ep.id;
            return (
              <button
                key={ep.id}
                onClick={() => handleSelect(ep)}
                className={`w-full text-right p-3 rounded-xl transition text-xs flex flex-col space-y-1.5 ${
                  isSelected
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-950 font-bold'
                    : 'hover:bg-slate-50 border border-transparent text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{ep.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                      ep.method === 'GET'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {ep.method}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 truncate text-left" dir="ltr">
                  {ep.path}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Side: Request & Response Console */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-4">
            {/* Description */}
            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="font-bold text-slate-900 block mb-0.5">{selectedEndpoint.name}</span>
              <span>{selectedEndpoint.description}</span>
            </div>

            {/* URL input bar */}
            <div className="flex items-center space-x-2 space-x-reverse" dir="ltr">
              <span
                className={`px-3 py-2 text-xs font-mono font-bold rounded-xl ${
                  selectedEndpoint.method === 'GET'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {selectedEndpoint.method}
              </span>
              <input
                type="text"
                value={requestUrl}
                onChange={(e) => setRequestUrl(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <button
                onClick={handleSendRequest}
                disabled={isLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isLoading ? 'ارسال...' : 'ارسال درخواست'}</span>
              </button>
            </div>

            {/* Request Body if POST */}
            {selectedEndpoint.method === 'POST' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  بدنه درخواست (JSON Request Payload):
                </label>
                <textarea
                  rows={4}
                  dir="ltr"
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={copyCurl}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>کپی دستور cURL</span>
              </button>
            </div>
          </div>

          {/* Response Block */}
          <div className="bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-800 text-slate-100 space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Code className="w-4 h-4 text-emerald-400" />
                <span className="font-mono text-slate-300">پاسخ سرور (Server Response JSON)</span>
              </div>
              {statusBadge !== null && (
                <span
                  className={`px-2 py-0.5 rounded font-mono text-xs font-bold ${
                    statusBadge >= 200 && statusBadge < 300
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  }`}
                >
                  HTTP {statusBadge}
                </span>
              )}
            </div>

            <pre
              dir="ltr"
              className="font-mono text-xs overflow-x-auto p-2 bg-black/40 rounded-xl max-h-[300px] text-emerald-300/90 leading-relaxed"
            >
              {responseOutput || '// برای مشاهده نتیجه روی دکمه "ارسال درخواست" کلیک کنید'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
