# Build 122 Integration Guide
**Feature:** Two-Style Video Prompt Generator (Explainer + Narrative)
**Files:** BUILD_122_VIDEO_STYLES.js → treeplexity.html
**Time:** 15-30 minutes

---

## 🎯 What This Does

Adds TWO video prompt generation styles:

1. **📊 Explainer/Documentary** - Clean, logical, educational (for investors, team, education)
2. **🎭 Narrative/Story** - Character-driven drama (for marketing, storytelling, emotion)

**User Experience:**
1. User clicks "Generate Prompt" for Film pattern
2. Modal appears: "Choose Video Style"
3. User selects Explainer or Narrative
4. AI generates prompts in selected style
5. Same project data, different storytelling approach!

---

## 📝 Integration Steps

### Step 1: Locate the Old Function

Open `treeplexity.html` and search for:
```
function generateAIVideoPrompts(tree, pattern) {
```

**Location:** Around line 12770

This is the OLD function that needs to be replaced.

---

### Step 2: Replace the Function

**Delete** the old `generateAIVideoPrompts` function (lines 12770-12830 approximately).

**Replace with** the NEW function from `BUILD_122_VIDEO_STYLES.js`.

**What to copy:**
- Copy lines 1-600 from BUILD_122_VIDEO_STYLES.js
- Paste into treeplexity.html starting at line 12770 (where old function was)

---

### Step 3: Keep synthesizeVideoPrompt

**IMPORTANT:** Do NOT delete the existing `synthesizeVideoPrompt` function (line ~12834).

The new code works ALONGSIDE it, not replacing it. The old `synthesizeVideoPrompt` is still used for backward compatibility.

---

### Step 4: Test the Integration

**Quick Test:**
1. Open treeplexity.html in browser
2. Load any CAPEX tree (or create one)
3. Open browser console (F12)
4. Run: `generateAIVideoPrompts(capexTree, 'film')`
5. Should see style selector modal appear!

---

## 🧪 Full Test Plan

### Test Case 1: Explainer Style

**Input:**
- Load CAPEX tree with land acquisition ($2M, 12-18 months)
- Call `generateAIVideoPrompts(capexTree, 'film', 'explainer')`

**Expected Output:**
```
Style: High-end Corporate Documentary. Photorealistic. 8k resolution.
Shot: Slow tracking shot or aerial drone view establishing the scope.
Subject: Land Acquisition.
Action: Secure 40 acres for solar farm development. The visualization builds itself on screen with clean architectural lines.
Overlay Graphics: Budget graphic showing $2.0M overlaid on screen. Timeline graphic animating: 12-18 months.
Setting: Construction site or development location.
Lighting: Bright, clean, clinical, "Apple store" aesthetic with soft shadows.
Mood: Competent, organized, futuristic, inspiring confidence.
Camera: Steady, professional gimbal movement. Wide to medium shots.
```

---

### Test Case 2: Narrative Style

**Input:**
- Same tree, but call `generateAIVideoPrompts(capexTree, 'film', 'narrative')`
- Assume assignee is "Sarah Chen"

**Expected Output:**
```
Style: Cinematic Movie Scene. Anamorphic lens. Film grain.
Character: Sarah Chen (30s-40s, professional, determined expression)
Setting: Modern office conference room, early morning, project plans visible
Action: Sarah Chen is securing 40 acres for solar farm development. Optimistic but focused, ready to take on the world. Career-defining moment. Millions on the line.
Detail: Close-up on Sarah Chen's face showing hope mixed with determination. Show determination and professionalism.
Lighting: Morning sun streaming through windows, golden and hopeful. Cinematic contrast with dramatic shadows.
Mood: Optimistic but focused, ready to take on the world. High stakes atmosphere.
Camera: Dynamic - Start wide, dolly in to close-up, or handheld for intensity.
```

---

### Test Case 3: Hero Detection

**Test hero detection works:**
```javascript
// In console:
const hero = findProjectHero(capexTree);
console.log('Detected hero:', hero);
```

**Expected:**
- Should detect "Sarah Chen" if she's assigned to multiple tasks
- Should detect name from descriptions if no assignees
- Should default to "The Project Lead" if nothing found

---

### Test Case 4: Modal UI

**Test style selector modal:**
1. Call `generateAIVideoPrompts(capexTree, 'film')` (no style parameter)
2. Modal should appear with two cards
3. Hover over cards - should scale up and glow blue
4. Click "Explainer" → Modal closes, generates explainer prompts
5. Repeat, click "Narrative" → Generates narrative prompts
6. Click "Cancel" → Modal closes, no generation

---

## 🔍 Troubleshooting

### Issue: Modal doesn't appear

**Fix:** Check that `showVideoStyleSelector` function is defined before `generateAIVideoPrompts`.

---

### Issue: "displayGeneratedPrompt is not defined"

**Fix:** You need to implement `displayGeneratedPrompt` function. For now, use this:

```javascript
function displayGeneratedPrompt(prompt, title) {
    // Copy to clipboard
    navigator.clipboard.writeText(prompt).then(() => {
        alert(`${title}\n\nPrompt copied to clipboard!`);
    });

    // Or show in console
    console.log('=== GENERATED PROMPT ===');
    console.log(prompt);
}
```

---

### Issue: Hero detection returns "The Project Lead" always

**Fix:** Check that your tree has `pmAssignee` fields populated. If using old trees, manually add assignees:

```javascript
capexTree.children[0].items[0].pmAssignee = "Sarah Chen";
```

---

## 📊 Feature Comparison

| Feature | Old (Build 121) | New (Build 122) |
|---------|----------------|-----------------|
| Video prompts | ✅ Yes | ✅ Yes |
| Styles | 1 (generic) | 2 (Explainer + Narrative) |
| Hero detection | ❌ No | ✅ Yes |
| Mood adaptation | ❌ No | ✅ Yes (risk/cost/status) |
| Style selector UI | ❌ No | ✅ Yes (modal) |
| Continuity tracking | ❌ No | ✅ Yes (previous scene) |
| Act structure | ❌ No | ✅ Yes (3-act for narrative) |

---

## 🎬 Real World Example

### Before (Build 121):
User gets one generic video prompt:
```
"Land acquisition. Secure 40 acres. Camera movement: static. Lighting: natural."
```

### After (Build 122):

**Explainer:**
```
"High-end corporate documentary. Aerial drone view of 40-acre site.
Budget graphic: $2M. Timeline: 12-18 months animating on screen.
Clean, organized, inspiring confidence."
```

**Narrative:**
```
"Sarah Chen (30s, determined) stands at construction site gate,
blueprints in hand. Morning sun, golden light. Close-up on her face:
hope mixed with determination. $2M on the line. Career-defining moment.
Cinematic anamorphic lens."
```

**MUCH better for Sora/Veo!**

---

## 🚀 Next Steps After Integration

1. ✅ Integrate code into treeplexity.html
2. ✅ Test both styles with sample tree
3. ✅ Update VERSION.md to Build 122
4. ✅ Commit and push to GitHub
5. ✅ Create demo video showing both styles
6. ✅ Tweet about new feature

---

## 📝 Changelog Entry for VERSION.md

```markdown
### v2.2.0 | Build 122 | 2025-11-19
**Two-Style Video Prompt Generator**
- NEW: Generate AI video prompts in two styles: Explainer + Narrative
- NEW: Explainer style for corporate, educational, investor videos
- NEW: Narrative style for marketing, storytelling, hero's journey
- NEW: Auto hero detection from assignees/descriptions
- NEW: Smart mood detection based on cost/risk/status
- NEW: Style selector modal UI (beautiful gradient cards)
- NEW: Scene continuity tracking for narrative flow
- IMPROVE: Video prompts now 3x more detailed and cinematic
- TECHNICAL: Hero detection scans assignees + name extraction
- TECHNICAL: Three-act structure for narrative mode
```

---

## ✅ Integration Checklist

- [ ] Located old `generateAIVideoPrompts` function (line ~12770)
- [ ] Copied new functions from BUILD_122_VIDEO_STYLES.js
- [ ] Pasted into treeplexity.html
- [ ] Kept old `synthesizeVideoPrompt` function intact
- [ ] Added `displayGeneratedPrompt` helper (if needed)
- [ ] Tested modal appears when called without style
- [ ] Tested explainer style generates clean prompts
- [ ] Tested narrative style generates dramatic prompts
- [ ] Tested hero detection finds names correctly
- [ ] Updated VERSION.md with Build 122 entry
- [ ] Committed changes to git
- [ ] Tested with real CAPEX tree
- [ ] Verified prompts work in Sora/Veo

---

**Status:** ✅ Ready to Integrate
**Estimated Time:** 15-30 minutes
**Difficulty:** Easy (copy/paste + test)

**Questions?** Check the code comments in BUILD_122_VIDEO_STYLES.js for detailed explanations of each function.
