import sys

def replace_in_file(filepath, old_str, new_str):
    with open(filepath, 'r') as f:
        content = f.read()

    content = content.replace(old_str, new_str)

    with open(filepath, 'w') as f:
        f.write(content)

replace_in_file(
    "src/pipeline.ts",
    "const aiBridge = new AIBridge({});",
    "const aiBridge = new AIBridge({\n                sunoCookie: process.env.SUNO_COOKIE,\n                udioToken: process.env.UDIO_TOKEN\n            });"
)
