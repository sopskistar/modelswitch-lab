"""Bounded, genuine hosted inference; records sanitized gateway evidence."""
import json, pathlib, urllib.request, urllib.error, datetime, time, uuid
env = {}
for line in pathlib.Path('.env.local').read_text().splitlines():
    if '=' in line and not line.startswith('#'):
        k,v=line.split('=',1);env[k.strip()]=v.strip().strip('"').strip("'")
base=env.get('OTARI_BASE_URL','https://api.otari.ai/api/v1').rstrip('/')
records=[]
metrics={}
for role in ['evaluator','analyst','routing']:
    model=env.get('OTARI_'+role.upper()+'_MODEL') if role!='routing' else env.get('OTARI_FALLBACK_POLICY')
    if not model:continue
    prompt='Classify this support request as billing, technical, account, cancellation, or general. Return only JSON with the key category. Request: I was charged twice for October.' if role=='evaluator' else ('Explain these deterministically verified benchmark results in one sentence; do not invent statistics: '+json.dumps(metrics)) if role=='analyst' else 'Return only JSON: {"gateway":"connected"}.'
    payload={'model':model,'messages':[{'role':'user','content':prompt}],'max_tokens':400,'temperature':0,'metadata':{'project':'modelswitch-lab','purpose':'integration-smoke','role':role}}
    req=urllib.request.Request(base+'/chat/completions',data=json.dumps(payload).encode(),headers={'Authorization':'Bearer '+env['OTARI_API_KEY'],'Content-Type':'application/json','Idempotency-Key':str(uuid.uuid4())})
    start=time.monotonic()
    try:
        with urllib.request.urlopen(req,timeout=35) as res:body=json.load(res);status=res.status;headers=dict(res.headers)
    except urllib.error.HTTPError as e:
        status=e.code;body=json.loads(e.read());headers=dict(e.headers)
    except Exception as e:
        records.append({'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'role':role,'requestedModel':model,'error':type(e).__name__});print(role,type(e).__name__);continue
    safe={k.lower():v for k,v in headers.items() if k.lower().startswith('otari-') or k.lower() in ['server-timing','retry-after']}
    record={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'role':role,'requestedModel':model,'status':status,'latencyMs':round((time.monotonic()-start)*1000),'headers':safe,'response':body}
    records.append(record)
    print(role,status,json.dumps(record)[:5000],flush=True)
    if role=='evaluator':
        content=body.get('choices',[{}])[0].get('message',{}).get('content','')
        try:passed=json.loads(content).get('category')=='billing'
        except:passed=False
        metrics={'cases':1,'passes':int(passed),'accuracy':int(passed),'latencyMs':record['latencyMs'],'usage':body.get('usage')}
pathlib.Path('evidence/smoke.json').write_text(json.dumps(records,indent=2)+'\n')
