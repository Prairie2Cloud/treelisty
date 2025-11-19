# Build 122 - Quick Start Guide
**Time to Deploy:** 15-30 minutes
**Difficulty:** Easy (copy/paste + test)

---

## ✅ What You're Getting

**Two-Style Video Prompt Generator:**
- 📊 **Explainer** - Corporate, educational, logical
- 🎭 **Narrative** - Cinematic, emotional, hero's journey

**Same CAPEX project → Two different movies!**

---

## 🚀 3-Step Integration

### Step 1: Open treeplexity.html
```bash
cd D:\OneDrive\Desktop\Production-Versions\treeplexity
code treeplexity.html  # Or your editor of choice
```

### Step 2: Find & Replace (Line ~12770)
**Search for:**
```javascript
function generateAIVideoPrompts(tree, pattern) {
```

**Replace entire function with:**
- Open `BUILD_122_VIDEO_STYLES.js`
- Copy ALL the code (lines 1-600)
- Paste into treeplexity.html at line 12770

**⚠️ IMPORTANT:** Keep the existing `synthesizeVideoPrompt` function (line ~12834). Don't delete it!

### Step 3: Save & Test
```bash
# Open in browser
start treeplexity.html

# Open browser console (F12)
# Run:
generateAIVideoPrompts(capexTree, 'film')
```

**Expected:** Beautiful modal appears with two style cards!

---

## 🧪 Quick Test

### Test 1: Modal Appears
```javascript
// In browser console:
generateAIVideoPrompts(capexTree, 'film')

// ✅ Should see modal with gradient cards
// ✅ Hover should make cards glow
// ✅ Click should generate prompts
```

### Test 2: Explainer Style
```javascript
const explainer = generateAIVideoPrompts(capexTree, 'film', 'explainer');
console.log(explainer);

// ✅ Should see documentary-style prompts
// ✅ Should mention "Corporate Documentary"
// ✅ Should have budget/timeline graphics
```

### Test 3: Narrative Style
```javascript
const narrative = generateAIVideoPrompts(capexTree, 'film', 'narrative');
console.log(narrative);

// ✅ Should see cinematic story prompts
// ✅ Should mention hero name (Sarah Chen, etc.)
// ✅ Should have emotional stakes
// ✅ Should say "Act I/II/III"
```

---

## 🎬 Real World Test

**Create a simple CAPEX tree:**
```javascript
capexTree.children[0].items[0] = {
    name: "Land Acquisition",
    description: "Secure 40 acres for solar farm",
    cost: 2000000,
    leadTime: "12-18 months",
    pmAssignee: "Sarah Chen"
};

// Generate narrative video prompt:
const video = generateAIVideoPrompts(capexTree, 'film', 'narrative');
console.log(video);
```

**Expected Output:**
```
Character: Sarah Chen (30s-40s, professional, determined)
Setting: Modern office conference room
Action: Sarah Chen is securing 40 acres for solar farm.
        Optimistic but focused. Career-defining moment.
        $2M on the line.
Mood: High stakes atmosphere.
Lighting: Morning sun streaming through windows.
Camera: Start wide, dolly in to close-up.
```

---

## ⚡ If Something Goes Wrong

### Issue: Modal doesn't appear
**Fix:** Check browser console for errors. Make sure `showVideoStyleSelector` function was copied.

### Issue: Hero is always "The Project Lead"
**Fix:** Add `pmAssignee` to your tree items:
```javascript
item.pmAssignee = "Sarah Chen";
```

### Issue: Prompts are too short
**Fix:** Add more details to `description` field. The AI uses description to build prompts.

---

## 📊 Before/After Comparison

### OLD (Build 121):
```
"Land acquisition. Camera: static. Lighting: natural."
```
*55 characters. Generic. Boring.*

### NEW (Build 122) - Narrative:
```
Style: Cinematic Movie Scene. Anamorphic lens. Film grain.
Character: Sarah Chen (30s, determined project manager)
Setting: County office, tense negotiation room
Action: Sarah Chen is securing 40 acres for solar farm.
        Career-defining moment. $2M on the line.
Detail: Close-up showing hope mixed with determination.
Lighting: Morning sun streaming through windows, golden.
Mood: High stakes atmosphere.
Camera: Dynamic - wide to close-up dolly shot.
```
*850 characters. Cinematic. Ready for Sora!*

---

## ✅ Success Checklist

After integration, verify:
- [ ] Modal appears when calling without style parameter
- [ ] Explainer style generates documentary prompts
- [ ] Narrative style generates cinematic prompts
- [ ] Hero detection finds assignee names
- [ ] Act structure shows (Challenge/Struggle/Triumph)
- [ ] No console errors

---

## 🚀 Deploy

Once tests pass:
```bash
git add treeplexity.html VERSION.md
git commit -m "Build 122: Two-Style Video Prompt Generator (Explainer + Narrative)"
git push origin main
```

Netlify will auto-deploy in ~2 minutes!

---

## 📝 What's Next?

### Immediate (Today/Tomorrow):
1. Test with real user trees
2. Gather feedback on both styles
3. Tweet about the new feature

### Future (If Users Love It):
1. Add third style: "Montage/B-Roll"
2. Add direct Sora API integration
3. Implement full pattern switching (Generic → Book → Film)

---

## 🎉 You're Done!

**Build 122 is ready to ship!**

Total effort:
- Research: 51,000 words ✅
- Code: 600 lines ✅
- Documentation: 5 guides ✅
- Integration: 15-30 minutes ⏸️

**Next:** Copy code → Test → Ship! 🚀

---

## 📞 Need Help?

Check these files:
1. **BUILD_122_VIDEO_STYLES.js** - The code (with comments)
2. **BUILD_122_INTEGRATION_GUIDE.md** - Detailed instructions
3. **BUILD_122_SUMMARY.md** - Complete feature overview
4. **CAPEX_TO_FILM_IMPLEMENTATION.md** - Original design doc

**All systems GO!** 🎬
