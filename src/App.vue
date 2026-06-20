<script setup>
import { computed, onMounted, ref } from 'vue';
import {
  addPending,
  decrementItems,
  fallbackProducts,
  fetchProducts,
  getPending,
  syncPending
} from './api';
import closeSrc from './assets/close.svg';
import feijoaSrc from './assets/dehuy.png';
import grushaSrc from './assets/grusha.png';
import lemonSrc from './assets/lemon.png';
import loaderVideo from './assets/nata-loader.webm';
import logoSrc from './assets/nata-logo.svg';
import saperaviSrc from './assets/saperavi.png';
import shopperSrc from './assets/shopper.png';
import stickerSrc from './assets/sticker.png';
import tarhunSrc from './assets/tarhun.png';

const resultAssets = {
  'Груша': {
    image: grushaSrc,
    title: 'Какое же застолье без подарков?'
  },
  'Фейхоа': {
    image: feijoaSrc,
    title: 'Этот день стал чуточку теплее'
  },
  'Саперави': {
    image: saperaviSrc,
    title: 'Отличный день для сюрпризов'
  },
  'Тархун': {
    image: tarhunSrc,
    title: 'Еще один повод улыбнуться'
  },
  'Лимон-лайм': {
    image: lemonSrc,
    title: 'Отличный день для сюрпризов'
  },
  'Шоппер': {
    image: shopperSrc,
    title: 'Маленькие радости делают день особенным'
  },
  'Стикерпак': {
    image: stickerSrc,
    title: 'Чтобы хорошее настроение осталось с вами'
  }
};

const products = ref([...fallbackProducts]);
const phase = ref('start');
const selected = ref(null);
const isPersisting = ref(false);
const message = ref('');
const pendingCount = ref(0);

const availableProducts = computed(() => products.value.filter((product) => product.stock > 0));
const totalStock = computed(() => availableProducts.value.reduce((sum, product) => sum + product.stock, 0));
const currentResult = computed(() => resultAssets[selected.value?.name] ?? null);

function preloadImage(src) {
  if (!src) return Promise.resolve();

  return new Promise((resolve) => {
    const image = new Image();
    image.onload = resolve;
    image.onerror = resolve;
    image.src = src;
  });
}

function refreshPendingCount() {
  pendingCount.value = getPending().reduce((sum, item) => sum + item.quantity, 0);
}

function pickWeightedProduct() {
  if (!availableProducts.value.length) return null;

  let cursor = Math.random() * totalStock.value;

  for (const product of availableProducts.value) {
    cursor -= product.stock;
    if (cursor <= 0) return product;
  }

  return availableProducts.value.at(-1);
}

async function loadProducts() {
  try {
    products.value = await fetchProducts();
  } catch {
    message.value = '';
  }
}

async function trySyncPending() {
  try {
    const syncedProducts = await syncPending();
    if (syncedProducts) {
      products.value = syncedProducts;
      message.value = '';
    }
  } catch {
    message.value = '';
  } finally {
    refreshPendingCount();
  }
}

async function startGame() {
  const winner = pickWeightedProduct();

  if (!winner) {
    message.value = 'Все призы закончились.';
    return;
  }

  selected.value = winner;
  message.value = '';
  phase.value = 'video';
  void preloadImage(resultAssets[winner.name]?.image);
  await trySyncPending();
}

function resetGame() {
  selected.value = null;
  message.value = '';
  phase.value = 'start';
}

async function persistWin(product) {
  isPersisting.value = true;

  try {
    products.value = await decrementItems([{ id: product.id, quantity: 1 }]);
    message.value = '';
  } catch {
    addPending({ id: product.id, quantity: 1 });
    products.value = products.value.map((item) =>
      item.id === product.id ? { ...item, stock: Math.max(item.stock - 1, 0) } : item
    );
    message.value = '';
  } finally {
    isPersisting.value = false;
    refreshPendingCount();
  }
}

async function showResult() {
  await preloadImage(currentResult.value?.image);
  phase.value = 'result';

  if (selected.value) {
    await persistWin(selected.value);
  }
}

onMounted(async () => {
  refreshPendingCount();
  await loadProducts();
  await trySyncPending();
});
</script>

<template>
  <main class="app-shell">
    <img
      :src="logoSrc"
      alt="Beer Roulette Logo"
      class="logo nata-logo"
      :class="{ 'nata-logo--result': phase === 'result' }"
    />
    <Transition name="screen-fade" mode="out-in">
      <section v-if="phase === 'start'" key="start" class="start-screen">
        <h3>Жми на кнопку и получай<br>свой подарок от Натахтари!</h3>
        <button class="primary-action" type="button" @click="startGame">
          <span class="pulse-ring pulse-ring-1" aria-hidden="true"></span>
          <span class="pulse-ring pulse-ring-2" aria-hidden="true"></span>
          <span class="pulse-ring pulse-ring-3" aria-hidden="true"></span>
          <span class="primary-action-label">ПОДАРОК</span>
        </button>
      </section>

      <section v-else-if="phase === 'video'" key="video" class="video-screen">
        <video
          class="loader-video"
          :src="loaderVideo"
          autoplay
          muted
          playsinline
          @ended="showResult"
        ></video>
        <p>Подбираем вкусы...</p>
      </section>

      <section v-else key="result" class="result-screen">
        <button class="close-action" type="button" aria-label="Вернуться в начало" @click="resetGame">
          <img :src="closeSrc" alt="" />
        </button>

        <img
          v-if="currentResult"
          :src="currentResult.image"
          :alt="selected?.name"
          class="result-image"
        />

        <div class="result-copy">
          <h3>{{ currentResult?.title }}</h3>
          <p>Спасибо, что заглянули в гости!</p>
        </div>
      </section>
    </Transition>
  </main>
</template>
