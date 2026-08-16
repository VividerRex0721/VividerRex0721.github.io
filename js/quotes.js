/* ============================================================
 * js/quotes.js —— 随机一言（古诗 / 二次元名句）
 * 页面加载时先用本地名句库立即显示（零等待），
 * 再后台请求免费公开的一言 API（v1.hitokoto.cn，支持 CORS），
 * 成功则平滑替换为网络句子；网络不可用时保持本地句子。
 * ============================================================ */
(function () {
  'use strict';

  /* 内置兜底名句库（古诗为公共领域，其余为广为流传的经典台词） */
  const FALLBACK = [
    { text: '山重水复疑无路，柳暗花明又一村。', from: '陆游《游山西村》' },
    { text: '长风破浪会有时，直挂云帆济沧海。', from: '李白《行路难》' },
    { text: '会当凌绝顶，一览众山小。', from: '杜甫《望岳》' },
    { text: '海上生明月，天涯共此时。', from: '张九龄《望月怀远》' },
    { text: '莫愁前路无知己，天下谁人不识君。', from: '高适《别董大》' },
    { text: '千磨万击还坚劲，任尔东西南北风。', from: '郑燮《竹石》' },
    { text: '但愿人长久，千里共婵娟。', from: '苏轼《水调歌头》' },
    { text: '纸上得来终觉浅，绝知此事要躬行。', from: '陆游《冬夜读书示子聿》' },
    { text: '采菊东篱下，悠然见南山。', from: '陶渊明《饮酒》' },
    { text: '天生我材必有用，千金散尽还复来。', from: '李白《将进酒》' },
    { text: '路漫漫其修远兮，吾将上下而求索。', from: '屈原《离骚》' },
    { text: '欲穷千里目，更上一层楼。', from: '王之涣《登鹳雀楼》' },
    { text: '真相只有一个。', from: '《名侦探柯南》' },
    { text: '我是要成为海贼王的男人。', from: '《海贼王》' },
    { text: '只要记住你的名字，不管你在世界的哪个地方，我一定会去见你。', from: '《你的名字。》' },
    { text: '与其想着怎样华丽地死去，不如想想怎样华丽地活下去吧。', from: '《银魂》' },
    { text: '我不知道将去何方，但我已在路上。', from: '《千与千寻》' },
    { text: '人类的赞歌就是勇气的赞歌。', from: '《JOJO的奇妙冒险》' },
    { text: '不必太纠结于当下，也不必太忧虑未来，当你经历过一些事情的时候，眼前的风景已经和从前不一样了。', from: '村上春树' },
    { text: '世界上只有一种真正的英雄主义，那就是认清生活的真相后依然热爱生活。', from: '罗曼·罗兰' },
    { text: '愿你千帆历尽，归来仍是少年。', from: '网络名句' },
  ];

  const state = { loading: false };
  const lastPick = { idx: -1 };

  function fallback() {
    let idx = (Math.random() * FALLBACK.length) | 0;
    if (FALLBACK.length > 1) {
      while (idx === lastPick.idx) idx = (Math.random() * FALLBACK.length) | 0;
    }
    lastPick.idx = idx;
    return FALLBACK[idx];
  }

  async function fetchQuote() {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    try {
      /* c=i 诗词 / c=a 动画 / c=b 漫画 / c=h 影视 / c=d 文学 */
      const r = await fetch('https://v1.hitokoto.cn/?c=i&c=a&c=b&c=h&c=d', { signal: ctrl.signal });
      if (!r.ok) throw new Error('status ' + r.status);
      const d = await r.json();
      if (!d || !d.hitokoto) throw new Error('empty');
      let from = '';
      if (d.from_who) from = d.from_who + (d.from ? '《' + d.from + '》' : '');
      else if (d.from) from = '《' + d.from + '》';
      return { text: String(d.hitokoto), from: from || '一言' };
    } catch (e) {
      return fallback();
    } finally {
      clearTimeout(timer);
    }
  }

  function applyQuote(q) {
    const textEl = document.getElementById('quoteText');
    const fromEl = document.getElementById('quoteFrom');
    if (textEl) textEl.textContent = q.text;
    if (fromEl) fromEl.textContent = '—— ' + q.from;
  }

  function showQuote(btn, silent) {
    const textEl = document.getElementById('quoteText');
    if (!textEl) return;
    if (state.loading) return;
    state.loading = true;
    /* 用户手动点击时转圈；初始静默加载不转圈，避免 6 秒等待感 */
    if (btn && !silent) btn.classList.add('spinning');
    fetchQuote().then((q) => {
      applyQuote(q);
    }).finally(() => {
      state.loading = false;
      if (btn && !silent) setTimeout(() => btn.classList.remove('spinning'), 500);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('quoteRefresh');
    if (btn) btn.addEventListener('click', () => showQuote(btn));
    /* 先立即显示本地句子（无网络等待），再后台拉取远程句子替换 */
    applyQuote(fallback());
    showQuote(btn, true);
  });
})();
