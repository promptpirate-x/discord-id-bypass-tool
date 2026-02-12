<p align="center">
  <img src="assets/logo.png" width="180" alt="PromptPirate" />
</p>

<h1 align="center">☠ Discord ID Bypass Tool</h1>

<p align="center">
  <strong>by <a href="https://github.com/promptpirate-x">PromptPirate</a></strong><br/>
  <em>Real-time 3D avatar head & mouth controller with gamepad + keyboard support</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Three.js-r128-black?logo=threedotjs" />
  <img src="https://img.shields.io/badge/VRM-supported-orange" />
  <img src="https://img.shields.io/badge/FBX-supported-purple" />
  <img src="https://img.shields.io/badge/GLB-supported-blue" />
  <img src="https://img.shields.io/badge/license-MIT-green" />
  <img src="https://komarev.com/ghpvc/?username=promptpirate-x&repo=discord-id-bypass-tool&color=blue&style=for-the-badge&label=repo+views" />
</p>

---
# UPDATE 1
https://age-verifier.kibty.town/
These anons have a script you can use in the console editor to get a 100% pass rate, and if you're willing to fuck around in the console I honestly reccomend doing things this way atm. Out of several thousand people having no problem my tool and with the model I included, I have seen some people getting picked up as kids with that same model, which I only picked becuase it worked for me and my mates and was only a few mb. My tool with some extra features and an older model (when I find a good one) will still be good for all selfie verifier tests in a few days instead of just Discord, but if the console script above works 100% of the time, consider using it just in case. 
Credits to:
https://kibty.town/
https://github.com/Dziurwa14

If you have a good older model in mind thats fully rigged and not anime styled, link it to me in the issue section so I can test it out.

# UPDATE 2
Discord "may" be adding blink tests now, so let me know if they are and ill map that with an update. Either way, Discord is rooted in the short/long term, time to bail. This will help anons who've been locked out if they need to find out where the server they were in is migrating to. Message me on X or Discord (womp) if they add in new requirements for the selfie-check, as I'll have no idea otherwise. If you find a better looking free model thats fully rigged, let me know and I'll update the repo

### Harambe Memorial Day Is Coming Soon, Lest We Forget 🕊🙏
<div align="center">
  <img src="https://github.com/user-attachments/assets/2b04e3e6-ca69-4557-aafb-c74e3811b0f3" alt="Harambe Memorial Day">
</div>

## What is this?

A browser-based tool that lets you control a 3D rigged avatar's head and mouth in real-time using a gamepad (DualSense, Xbox, etc.) or keyboard to skirt the discord juice, or soyjack with your favourite rigged models just for fun! 
***A model with mouth rigging is included in the assets folder!****

https://github.com/user-attachments/assets/4aba4a67-9847-4d28-9c8c-4129a67e9332
### Features

- **Multi-format support** — VRM, FBX (with textures via ZIP or folder drop), GLB/GLTF
- **Automatic bone detection** — finds Head, Neck, Jaw bones by name or VRM humanoid API
- **Morph target tester** — preview every blend shape with sliders, map the right mouth shape to your controller
- **Mouth overdrive** — push morph targets beyond 100% for exaggerated expressions
- **Gamepad + keyboard** — left stick / WASD for head, RT / Space for mouth
- **Orbit camera** — right-click drag to orbit, scroll to zoom, quick-focus buttons
- **Zero install** — single HTML file, runs in any modern browser

## Quick Start

1. Open `index.html` in your browser
2. Load a rigged model (VRM, FBX, GLB) (FBX model included in the zip)
3. Bones auto-detect — adjust in dropdowns if needed
4. Use the **Morph Tester** to find and map the right mouth shape
5. Control with gamepad or keyboard

## How to map the mouth to a controller
You have to click eyeleft mouthopen for some reason first, then go to Wolfhead3Dhead mouth open, and that slider will work with the model included
<img width="1233" height="1378" alt="Image" src="https://github.com/user-attachments/assets/727f2b11-bd2f-4061-bcda-d51df4b4c8a1" />

## Controls

| Action | Keyboard | Gamepad |
|--------|----------|---------|
| Head Yaw | A D | L-Stick X |
| Head Pitch | W S | L-Stick Y |
| Head Roll | Q / E | R-Stick X |
| Mouth Open | Space | RT |
| Reset | R | Y Button |

## Loading FBX with Textures

FBX files often have textures in a separate folder. Three ways to handle this:

1. **ZIP** — bundle the FBX + texture files into a `.zip` and load it directly
2. **Drag & drop folder** — drag the entire model folder onto the drop zone
3. **Multi-select** — click "select FBX + texture files together" and shift-click all files

## Where to Get Models

| Source | Format | Notes |
|--------|--------|-------|
| [VRoid Hub](https://hub.vroid.com) | VRM | Free downloads, instant bone setup |
| [VRoid Studio](https://vroid.com/en/studio) | VRM | Make your own avatar |
| [Mixamo](https://www.mixamo.com) | FBX | Free auto-rigged characters |
| [Sketchfab](https://sketchfab.com) | GLB/FBX | Search for "rigged" models |

## Demo Model

A demo model is included at `assets/demo-model.zip` — load it to test the tool immediately.

## Tech Stack

- [Three.js](https://threejs.org/) r128
- [@pixiv/three-vrm](https://github.com/pixiv/three-vrm) 0.6.11
- [JSZip](https://stuk.github.io/jszip/) 3.10.1
- [fflate](https://github.com/101arrowz/fflate) 0.6.9

All dependencies loaded from CDN. No build step required.

## License

MIT — do whatever you want with it.

---

<p align="center">
  <sub>☠ Made with love by <a href="https://github.com/PromptPirate">PromptPirate</a></sub>
</p>
