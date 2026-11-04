"""Read-only hosted discovery. Never prints credentials or raw management records."""
import json, urllib.request, urllib.error, pathlib, datetime
env = {}
for line in pathlib.Path('.env.local').read_text().splitlines():
    if '=' in line and not line.startswith('#'):
        k, v = line.split('=', 1); env[k.strip()] = v.strip().strip('"').strip("'")
base = env.get('OTARI_BASE_URL', 'https://api.otari.ai/api/v1').rstrip('/')
print('Hosted base:', base)
print('Roles:', {k:v for k,v in env.items() if k.endswith('_MODEL') or k.endswith('_POLICY')})
results = []
for path in ['/models', '/tools', '/routing/policies', '/tool-settings/guardrails/profiles', '/budgets']:
    req = urllib.request.Request(base+path, headers={'Authorization': 'Bearer '+env['OTARI_API_KEY']})
    try:
        with urllib.request.urlopen(req, timeout=25) as res:
            body=json.load(res); status=res.status
            headers={k:v for k,v in res.headers.items() if k.lower().startswith('otari-')}
    except urllib.error.HTTPError as e:
        status=e.code; body={'error':'Discovery not authorized or unavailable'}; headers={}
    record={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(), 'method':'GET', 'path':path, 'status':status, 'headers':headers}
    if path in ['/models','/tools']: record['data']=body
    elif path=='/routing/policies' and status==200: record['data']=body
    elif path.endswith('/profiles') and status==200: record['data']=body
    results.append(record)
    print(path,status,json.dumps(body)[:24000] if path in ['/models','/tools'] else 'read-only discovery')
pathlib.Path('/tmp/modelswitch-discovery.json').write_text(json.dumps(results,indent=2))
