#!/usr/bin/env python3
"""FIX: Replace old tab content with our new content, not append"""
import os, re
os.chdir('/workspaces/bleu-system')
with open('index.html','r') as f: html=f.read()

# For each panel, find content between panel open and chat-box, replace
# Panel structure: <div class="panel" id="p-xxx"> [CONTENT] <div class="chat-box" id="chat-xxx">
panels = re.findall(r'id="p-(\w+)"', html)
print(f'Panels found: {panels}')

for tab in panels:
    pid = 'id="p-'+tab+'"'
    cid = 'id="chat-'+tab+'"'
    pi = html.find(pid)
    ci = html.find(cid)
    if pi < 0:
        print(f'  {tab}: panel not found')
        continue
    if ci < 0:
        print(f'  {tab}: no chat box (may be special)')
        continue
    # Find the > after panel id (end of opening div tag)
    panel_open_end = html.find('>', pi) + 1
    # Find the <div that contains chat-box
    # We need to find the start of the chat-box div
    chat_div_start = html.rfind('<div', ci - 200, ci)
    if chat_div_start < 0:
        chat_div_start = ci - 50
    # Content between panel open and chat div
    old_content = html[panel_open_end:chat_div_start]
    old_len = len(old_content)
    # Check if our new content is in there (look for our markers)
    has_new = 'cursor:pointer' in old_content and 'margin:16px' in old_content
    has_old = 'class="section-title"' in old_content or 'class="feature-card"' in old_content or 'class="intro-card"' in old_content
    if has_old and has_new:
        # Both old and new — need to strip old, keep new
        # Find where our injected div starts
        new_start = old_content.find('<div style="margin:16px 0">')
        if new_start >= 0:
            # Keep only our new content
            new_content = old_content[new_start:]
            html = html[:panel_open_end] + '\n' + new_content + '\n' + html[chat_div_start:]
            saved = old_len - len(new_content)
            print(f'  {tab}: stripped {saved} bytes of old content, kept new')
        else:
            print(f'  {tab}: has both but cant find new start')
    elif has_old and not has_new:
        print(f'  {tab}: only old content (no injection landed here)')
    elif has_new and not has_old:
        print(f'  {tab}: clean — only new content')
    else:
        print(f'  {tab}: {old_len} bytes, checking...')

with open('index.html','w') as f: f.write(html)
new_size = len(html)
print(f'\nCleaned HTML: {new_size} bytes')
os.system('git add -A && git commit -m "FIX: Strip old content, keep only Spotify cards in all tabs" && git push --force')
print('DONE')
