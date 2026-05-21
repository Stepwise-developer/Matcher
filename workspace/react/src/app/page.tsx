"use client";

import {
  BadgeCheck,
  ClipboardCheck,
  House,
  Lightbulb,
  MessageCircle,
  RotateCcw,
  Settings,
  Sparkles,
  X,
  UserRound,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  CheckboxValueQuestion,
  ChatMessage,
  LevelingItem,
  RankingValueQuestion,
  RegistrationData,
  TextValueQuestion,
  ValueAnswer,
  UserProfile,
  ValueAnswers,
  ValueQuestion,
} from "@/types/api";

type RegistrationStep = "consent" | "profile";
type AppTab = "leveling" | "values" | "home" | "messages" | "settings";

type SwipeDirection = "left" | "right";

const storageKey = "omatcha-registration-v3";

const emptyProfile: UserProfile = {
  name: "",
  age: "",
  gender: "",
  height: "",
  weight: "",
  area: "",
  trainLine: "",
};

const ageOptions = Array.from({ length: 63 }, (_, index) =>
  String(index + 18),
);

const genderOptions = ["女性", "男性", "その他", "回答しない"];

const kantoPrefectures = [
  "東京都",
  "神奈川県",
  "埼玉県",
  "千葉県",
  "茨城県",
  "栃木県",
  "群馬県",
];

const metropolitanTrainLines = [
  "東西線",
  "埼京線",
  "山手線",
  "中央線",
  "総武線",
  "京浜東北線",
  "丸ノ内線",
  "有楽町線",
  "副都心線",
  "田園都市線",
  "東横線",
  "小田急線",
  "京王線",
  "西武池袋線",
  "東武東上線",
  "つくばエクスプレス",
];

const emptyValues: ValueAnswers = {};

const legalDocuments = {
  privacy: {
    title: "プライバシーポリシー",
    body: `# プライバシーポリシー

## 1. 取得する情報
Omatcha は、サービスの検証と改善のために、表示名、年齢、性別、身長、体重、エリア、沿線、価値観質問への回答、レベリング項目の達成状態、メッセージ内容を取得する場合があります。

## 2. 利用目的
取得した情報は、プロフィール表示、マッチング体験の検証、メッセージ機能の提供、レベリング機能の提供、サービス改善のために利用します。

## 3. 第三者提供
法令に基づく場合を除き、本人の同意なく個人情報を第三者へ提供しません。

## 4. 安全管理
取得した情報は、不正アクセス、紛失、改ざん、漏えいを防ぐために必要な範囲で管理します。

## 5. 問い合わせ
プライバシーに関する問い合わせは、サービス内の意見箱から送信できます。`,
  },
  terms: {
    title: "利用規約",
    body: `# 利用規約

## 1. 目的
本規約は、Omatcha の Web テストプロダクトを利用する際の条件を定めるものです。

## 2. 利用条件
利用者は、登録情報を正確に入力し、他者を尊重したコミュニケーションを行うものとします。

## 3. 禁止事項
- 虚偽情報の登録
- 他者への嫌がらせ、差別的発言、脅迫
- 営利目的の勧誘
- サービスの検証を妨げる行為
- 法令または公序良俗に反する行為

## 4. 利用停止
禁止事項に該当すると判断した場合、サービスの利用を停止することがあります。

## 5. 免責
本サービスは検証中のプロダクトであり、機能や表示内容は予告なく変更される場合があります。`,
  },
} as const;

const levelingItems: LevelingItem[] = [
  {
    id: "profile",
    title: "プロフィールを磨く",
    body: "写真、自己紹介、話したいテーマを整えるとマッチ後の会話が始めやすくなります。",
    criteria: "プロフィールの写真、自己紹介、話したいテーマを一通り見直している。",
  },
  {
    id: "message",
    title: "返信の体温を上げる",
    body: "定型文ではなく、相手のプロフィールに触れた一言を添えることを推奨します。",
    criteria: "相手のプロフィールに触れた返信文を作れる状態になっている。",
  },
  {
    id: "values",
    title: "価値観の差分を知る",
    body: "同じ部分だけでなく違いも見えるようにし、無理のない関係性を探します。",
    criteria: "相手との共通点と違いを、どちらも確認する意識を持てている。",
  },
];

const valueQuestions: ValueQuestion[] = [
  {
    id: "weekend",
    type: "ranking",
    title: "休日に気になる相手から誘われた場合",
    body: "あなたが優先しやすい行動の順に並び替えてください。",
    options: ["予定を調整して会いに行く", "短時間だけ会う", "別日を提案する", "まずメッセージで温度感を確認する"],
  },
  {
    id: "communication",
    type: "ranking",
    title: "返信が遅れてしまった場合",
    body: "関係を続けるために取りたい行動の順に並び替えてください。",
    options: ["遅れた理由を短く伝える", "次に話したい話題を添える", "すぐに電話を提案する", "相手のペースを確認する"],
  },
  {
    id: "growth",
    type: "ranking",
    title: "価値観が少し違うと感じた場合",
    body: "最初に取りたい行動の順に並び替えてください。",
    options: ["違いの理由を聞く", "共通点を探す", "一度距離を置いて考える", "自分の考えを丁寧に伝える"],
  },
  {
    id: "topics",
    type: "checkbox",
    title: "初対面で話しやすい話題",
    body: "会話の入口にしやすいものを選んでください。",
    options: ["休日の過ごし方", "食べ物", "映画や本", "仕事観", "住んでいる街", "最近行った場所"],
    minSelections: 1,
    maxSelections: 3,
  },
  {
    id: "free-note",
    type: "text",
    title: "関係を続ける上で大事にしたいこと",
    body: "あなたが大切にしたい考えを短く書いてください。",
    minLength: 5,
    maxLength: 120,
    placeholder: "例: 無理に合わせすぎず、違いを話し合えること",
  },
];

const matchedPartner = {
  name: "Rin",
};

const initialChatMessages: ChatMessage[] = [
  {
    id: "m1",
    sender: "partner",
    text: "プロフィール見ました。休日は展示に行くことが多いんですね。",
    time: "12:32",
  },
  {
    id: "m2",
    sender: "me",
    text: "はい。静かな展示をゆっくり見るのが好きです。Rinさんも美術館行きますか？",
    time: "12:35",
  },
  {
    id: "m3",
    sender: "partner",
    text: "行きます。最近は写真展が気になっています。",
    time: "12:40",
  },
  {
    id: "m4",
    sender: "me",
    text: "写真展いいですね。週末に行けそうな場所を探してみます。",
    time: "12:43",
  },
];

const cannedReply =
  "ありがとうございます。そこ、もう少し聞いてみたいです。";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [registration, setRegistration] = useState<RegistrationData | null>(
    null,
  );
  const [step, setStep] = useState<RegistrationStep>("consent");
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [profile, setProfile] = useState<UserProfile>(emptyProfile);
  const [profileAttempted, setProfileAttempted] = useState(false);
  const [legalState, setLegalState] = useState({
    privacyAgreed: false,
    privacyViewed: false,
    termsAgreed: false,
    termsViewed: false,
  });
  const [values, setValues] = useState<ValueAnswers>(emptyValues);
  const [valueQuestionIndex, setValueQuestionIndex] = useState(0);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);

    if (saved) {
      const parsed = JSON.parse(saved) as RegistrationData;
      setRegistration(parsed);
      setProfile(parsed.profile);
      setValues(parsed.values);
    }

    setMounted(true);
  }, []);

  const profileComplete = useMemo(() => {
    const height = Number(profile.height);
    const weight = Number(profile.weight);

    return (
      profile.name.trim().length >= 2 &&
      Boolean(profile.age) &&
      Boolean(profile.gender) &&
      Number.isFinite(height) &&
      height >= 100 &&
      height <= 230 &&
      Number.isFinite(weight) &&
      weight >= 30 &&
      weight <= 200 &&
      Boolean(profile.area) &&
      Boolean(profile.trainLine)
    );
  }, [profile]);

  function completeProfileRegistration() {
    const nextRegistration = {
      profile,
      values: emptyValues,
      valuesCompleted: false,
      blockedLevelingIds: levelingItems.map((item) => item.id),
      completedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(storageKey, JSON.stringify(nextRegistration));
    setRegistration(nextRegistration);
    setValues(emptyValues);
    setActiveTab("home");
    setValueQuestionIndex(0);
  }

  function completeValues(nextValues: ValueAnswers) {
    if (!registration) {
      return;
    }

    const nextRegistration = {
      ...registration,
      values: nextValues,
      valuesCompleted: true,
    };

    window.localStorage.setItem(storageKey, JSON.stringify(nextRegistration));
    setRegistration(nextRegistration);
    setValues(nextValues);
    setValueQuestionIndex(0);
    setActiveTab("home");
  }

  function updateRegistration(nextRegistration: RegistrationData) {
    window.localStorage.setItem(storageKey, JSON.stringify(nextRegistration));
    setRegistration(nextRegistration);
  }

  function resolveBlockedLevelingItem(itemId: string) {
    if (!registration) {
      return;
    }

    const blockedLevelingIds = registration.blockedLevelingIds.filter(
      (id) => id !== itemId,
    );

    updateRegistration({ ...registration, blockedLevelingIds });
  }

  function resetRegistration() {
    window.localStorage.removeItem(storageKey);
    setRegistration(null);
    setStep("consent");
    setProfile(emptyProfile);
    setProfileAttempted(false);
    setLegalState({
      privacyAgreed: false,
      privacyViewed: false,
      termsAgreed: false,
      termsViewed: false,
    });
    setValues(emptyValues);
    setActiveTab("home");
  }

  if (!mounted) {
    return (
      <main className="grid min-h-screen place-items-center px-6 font-sans text-text">
        <p className="border-2 border-border bg-surface px-4 py-3 shadow-mono">
          Loading Omatcha...
        </p>
      </main>
    );
  }

  if (!registration) {
    return (
      <OnboardingShell step={step}>
        {step === "profile" ? (
          <ProfileStep
            profile={profile}
            profileAttempted={profileAttempted}
            profileComplete={profileComplete}
            onChange={setProfile}
            onNext={() => {
              setProfileAttempted(true);

              if (profileComplete) {
                completeProfileRegistration();
              }
            }}
          />
        ) : null}
        {step === "consent" ? (
          <LegalConsentStep
            legalState={legalState}
            onAgreeChange={setLegalState}
            onNext={() => setStep("profile")}
          />
        ) : null}
      </OnboardingShell>
    );
  }

  const messagesEnabled =
    registration.blockedLevelingIds.length === 0 && registration.valuesCompleted;

  return (
    <main
      className={`min-h-screen font-sans text-text ${
        activeTab === "messages" && messagesEnabled
          ? "px-0 pb-12 pt-0"
          : "px-3 pb-14 pt-3 sm:px-4"
      }`}
    >
      <div
        className={`mx-auto flex w-full max-w-[480px] flex-col ${
          activeTab === "messages" && messagesEnabled
            ? "min-h-[calc(100dvh-48px)]"
            : "min-h-[calc(100dvh-72px)]"
        }`}
      >
        {activeTab === "home" ? (
          <HomeDashboard registration={registration} />
        ) : null}
        {activeTab === "leveling" ? (
          <LevelingHome
            onResolveItem={resolveBlockedLevelingItem}
            registration={registration}
          />
        ) : null}
        {activeTab === "values" ? (
          <ValuesHome
            onChange={setValues}
            onComplete={completeValues}
            onQuestionIndexChange={setValueQuestionIndex}
            questionIndex={valueQuestionIndex}
            registration={registration}
            values={values}
          />
        ) : null}
        {activeTab === "messages" ? (
          messagesEnabled ? <MessagesHome /> : <MessagesLocked />
        ) : null}
        {activeTab === "settings" ? (
          <SettingsHome
            registration={registration}
            onReset={resetRegistration}
          />
        ) : null}
      </div>

      <FooterNav
        activeTab={activeTab}
        messagesEnabled={messagesEnabled}
        onChange={setActiveTab}
      />
    </main>
  );
}

function OnboardingShell({
  children,
  step,
}: {
  children: ReactNode;
  step: RegistrationStep;
}) {
  const steps = [
    { id: "consent", label: "規約同意" },
    { id: "profile", label: "ユーザー情報" },
  ] as const;
  const activeIndex = steps.findIndex((item) => item.id === step);

  return (
    <main className="min-h-screen px-4 py-6 font-sans text-text sm:px-6">
      <section className="mx-auto w-full max-w-[480px] border-2 border-border bg-surface p-5 shadow-mono sm:p-6">
        <ol className="mt-5 grid grid-cols-2 gap-2">
          {steps.map((item, index) => (
            <li
              className={`border-2 px-2 py-2 text-center text-[11px] font-black ${
                index <= activeIndex
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-surface-alt text-muted"
              }`}
              key={item.id}
            >
              {item.label}
            </li>
          ))}
        </ol>
        <div className="mt-6">{children}</div>
      </section>
    </main>
  );
}

function ProfileStep({
  onChange,
  onNext,
  profile,
  profileAttempted,
  profileComplete,
}: {
  onChange: (profile: UserProfile) => void;
  onNext: () => void;
  profile: UserProfile;
  profileAttempted: boolean;
  profileComplete: boolean;
}) {
  function updateField(field: keyof UserProfile, value: string) {
    onChange({ ...profile, [field]: value });
  }

  const errors = getProfileErrors(profile);

  return (
    <section>
      <StepHeader
        body="マッチングと会話の出発点になる基本情報を入力します。条件を満たすまで次へ進めません。"
        icon={<UserRound size={22} />}
        title="1. ユーザー情報を入力"
      />
      <div className="mt-5 grid gap-4">
        <TextField
          error={profileAttempted ? errors.name : ""}
          help="2文字以上"
          label="表示名"
          onChange={(value) => updateField("name", value)}
          placeholder="例: matcha"
          value={profile.name}
        />
        <SelectField
          error={profileAttempted ? errors.age : ""}
          help="18歳以上"
          label="年齢"
          options={ageOptions}
          onChange={(value) => updateField("age", value)}
          placeholder="選択してください"
          value={profile.age}
        />
        <SelectField
          error={profileAttempted ? errors.gender : ""}
          help="プロフィールに表示する性別"
          label="性別"
          options={genderOptions}
          onChange={(value) => updateField("gender", value)}
          placeholder="選択してください"
          value={profile.gender}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            error={profileAttempted ? errors.height : ""}
            help="100〜230cmの数値"
            inputMode="numeric"
            label="身長"
            onChange={(value) => updateField("height", value)}
            placeholder="170"
            suffix="cm"
            value={profile.height}
          />
          <TextField
            error={profileAttempted ? errors.weight : ""}
            help="30〜200kgの数値"
            inputMode="numeric"
            label="体重"
            onChange={(value) => updateField("weight", value)}
            placeholder="60"
            suffix="kg"
            value={profile.weight}
          />
        </div>
        <SelectField
          error={profileAttempted ? errors.area : ""}
          help="関東圏のみ"
          label="エリア（都道府県）"
          options={kantoPrefectures}
          onChange={(value) => updateField("area", value)}
          placeholder="選択してください"
          value={profile.area}
        />
        <SelectField
          error={profileAttempted ? errors.trainLine : ""}
          help="首都圏の主要沿線のみ"
          label="沿線"
          options={metropolitanTrainLines}
          onChange={(value) => updateField("trainLine", value)}
          placeholder="選択してください"
          value={profile.trainLine}
        />
      </div>
      <ActionRow>
        <button
          className="min-h-12 bg-primary px-5 font-black text-white disabled:bg-surface-alt disabled:text-muted"
          onClick={onNext}
          type="button"
        >
          {profileComplete ? "次へ" : "入力内容を確認"}
        </button>
      </ActionRow>
    </section>
  );
}

function LegalConsentStep({
  legalState,
  onAgreeChange,
  onNext,
}: {
  legalState: {
    privacyAgreed: boolean;
    privacyViewed: boolean;
    termsAgreed: boolean;
    termsViewed: boolean;
  };
  onAgreeChange: (state: {
    privacyAgreed: boolean;
    privacyViewed: boolean;
    termsAgreed: boolean;
    termsViewed: boolean;
  }) => void;
  onNext: () => void;
}) {
  const [activeDocument, setActiveDocument] = useState<
    keyof typeof legalDocuments | null
  >(null);
  const canContinue = legalState.privacyAgreed && legalState.termsAgreed;

  function openDocument(documentKey: keyof typeof legalDocuments) {
    setActiveDocument(documentKey);
    onAgreeChange({
      ...legalState,
      privacyViewed:
        legalState.privacyViewed || documentKey === "privacy",
      termsViewed: legalState.termsViewed || documentKey === "terms",
    });
  }

  return (
    <section>
      <StepHeader
        body="登録前にプライバシーポリシーと利用規約を確認し、両方に同意してください。"
        icon={<UserRound size={22} />}
        title="規約への同意"
      />
      <div className="mt-5 grid gap-4">
        <LegalConsentItem
          agreed={legalState.privacyAgreed}
          disabled={!legalState.privacyViewed}
          onOpen={() => openDocument("privacy")}
          onToggle={(checked) =>
            onAgreeChange({ ...legalState, privacyAgreed: checked })
          }
          title="プライバシーポリシー"
          viewed={legalState.privacyViewed}
        />
        <LegalConsentItem
          agreed={legalState.termsAgreed}
          disabled={!legalState.termsViewed}
          onOpen={() => openDocument("terms")}
          onToggle={(checked) =>
            onAgreeChange({ ...legalState, termsAgreed: checked })
          }
          title="利用規約"
          viewed={legalState.termsViewed}
        />
      </div>
      <ActionRow>
        <button
          className="min-h-12 bg-primary px-5 font-black text-white disabled:bg-surface-alt disabled:text-muted"
          disabled={!canContinue}
          onClick={onNext}
          type="button"
        >
          登録画面へ
        </button>
      </ActionRow>
      {activeDocument ? (
        <LegalDocumentModal
          body={legalDocuments[activeDocument].body}
          onClose={() => setActiveDocument(null)}
          title={legalDocuments[activeDocument].title}
        />
      ) : null}
    </section>
  );
}

function LegalConsentItem({
  agreed,
  disabled,
  onOpen,
  onToggle,
  title,
  viewed,
}: {
  agreed: boolean;
  disabled: boolean;
  onOpen: () => void;
  onToggle: (checked: boolean) => void;
  title: string;
  viewed: boolean;
}) {
  return (
    <div className="border-2 border-border bg-surface-alt p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-black">{title}</h2>
          <p className="mt-1 text-xs font-bold text-muted">
            {viewed ? "確認済み" : "内容を表示すると同意できます"}
          </p>
        </div>
        <button
          className="min-h-10 border-2 border-border bg-surface px-3 text-sm font-black"
          onClick={onOpen}
          type="button"
        >
          表示する
        </button>
      </div>
      <label className="mt-4 flex items-center gap-3 text-sm font-black">
        <input
          checked={agreed}
          className="size-5 accent-black"
          disabled={disabled}
          onChange={(event) => onToggle(event.target.checked)}
          type="checkbox"
        />
        <span className={disabled ? "text-muted" : "text-text"}>
          {title}に同意する
        </span>
      </label>
    </div>
  );
}

function LegalDocumentModal({
  body,
  onClose,
  title,
}: {
  body: string;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/25 px-4">
      <button
        aria-label="文書の背景を閉じる"
        className="absolute inset-0"
        onClick={onClose}
        type="button"
      />
      <article className="relative max-h-[78dvh] w-full max-w-[480px] overflow-y-auto border-2 border-border bg-surface p-5 shadow-mono">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-black">{title}</h2>
          <button
            aria-label="文書を閉じる"
            className="grid size-9 shrink-0 place-items-center border-2 border-border bg-surface-alt"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>
        <MarkdownPreview markdown={body} />
      </article>
    </div>
  );
}

function MarkdownPreview({ markdown }: { markdown: string }) {
  return (
    <div className="mt-4 grid gap-3 text-sm leading-6">
      {markdown
        .split("\n")
        .filter((line) => line.trim())
        .map((line, index) => {
          if (line.startsWith("# ")) {
            return (
              <h1 className="text-xl font-black" key={`${line}-${index}`}>
                {line.replace("# ", "")}
              </h1>
            );
          }

          if (line.startsWith("## ")) {
            return (
              <h2 className="mt-2 font-black" key={`${line}-${index}`}>
                {line.replace("## ", "")}
              </h2>
            );
          }

          if (line.startsWith("- ")) {
            return (
              <p className="pl-3 font-bold text-muted" key={`${line}-${index}`}>
                ・{line.replace("- ", "")}
              </p>
            );
          }

          return (
            <p className="font-bold text-muted" key={`${line}-${index}`}>
              {line}
            </p>
          );
        })}
    </div>
  );
}

function LevelingStep({
  item,
  itemNumber,
  itemTotal,
  onBack,
  onSwipe,
}: {
  item: LevelingItem;
  itemNumber: number;
  itemTotal: number;
  onBack: () => void;
  onSwipe: (itemId: string, achieved: boolean) => void;
}) {
  return (
    <section>
      <StepHeader
        body="重なったカードを1枚ずつ確認します。達成していれば右、まだなら左へ大きく動かします。"
        icon={<ClipboardCheck size={22} />}
        title="2. レベルアップ項目の確認"
      />
      <div className="mt-5">
        <SwipeLevelingDeck
          activeIndex={itemNumber - 1}
          items={levelingItems}
          mode="both"
          onSwipe={(swipedItem, direction) =>
            onSwipe(swipedItem.id, direction === "right")
          }
        />
        <div className="mt-4 flex items-center justify-between text-xs font-black text-muted">
          <span>左へ大きく</span>
          <span>
            {itemNumber}/{itemTotal}
          </span>
          <span>右へ大きく</span>
        </div>
      </div>
      <ActionRow>
        <button className="min-h-12 border-2 border-border px-5 font-black" onClick={onBack} type="button">
          戻る
        </button>
      </ActionRow>
    </section>
  );
}

function createDefaultValueAnswer(question: ValueQuestion): ValueAnswer {
  if (question.type === "ranking") {
    return { type: "ranking", order: [...question.options] };
  }

  if (question.type === "checkbox") {
    return { type: "checkbox", selected: [] };
  }

  return { type: "text", text: "" };
}

function getValueAnswer(
  question: ValueQuestion,
  values: ValueAnswers,
): ValueAnswer {
  const answer = values[question.id];

  if (answer?.type === question.type) {
    return answer;
  }

  return createDefaultValueAnswer(question);
}

function isValueQuestionAnswered(question: ValueQuestion, answer?: ValueAnswer) {
  if (!answer || answer.type !== question.type) {
    return false;
  }

  if (question.type === "ranking" && answer.type === "ranking") {
    return answer.order.length === question.options.length;
  }

  if (question.type === "checkbox" && answer.type === "checkbox") {
    const minSelections = question.minSelections ?? 1;
    const maxSelections = question.maxSelections ?? question.options.length;

    return (
      answer.selected.length >= minSelections &&
      answer.selected.length <= maxSelections
    );
  }

  if (question.type === "text" && answer.type === "text") {
    const textLength = answer.text.trim().length;

    return (
      textLength >= (question.minLength ?? 1) &&
      textLength <= (question.maxLength ?? Number.POSITIVE_INFINITY)
    );
  }

  return false;
}

function ValuesStep({
  onBack,
  onChange,
  onComplete,
  onQuestionIndexChange,
  questionIndex,
  values,
}: {
  onBack?: () => void;
  onChange: (values: ValueAnswers) => void;
  onComplete: (values: ValueAnswers) => void;
  onQuestionIndexChange: (index: number) => void;
  questionIndex: number;
  values: ValueAnswers;
}) {
  const question = valueQuestions[questionIndex];
  const currentAnswer = getValueAnswer(question, values);
  const isLastQuestion = questionIndex === valueQuestions.length - 1;
  const projectedValues = { ...values, [question.id]: currentAnswer };
  const canFinishValues = valueQuestions.every(
    (valueQuestion) =>
      isValueQuestionAnswered(valueQuestion, projectedValues[valueQuestion.id]),
  );
  const canGoNext = isValueQuestionAnswered(question, currentAnswer);

  function updateAnswer(nextAnswer: ValueAnswer) {
    onChange({ ...values, [question.id]: nextAnswer });
  }

  function goNext() {
    if (!canGoNext) {
      return;
    }

    const nextValues = projectedValues;
    onChange(nextValues);

    if (isLastQuestion) {
      onComplete(nextValues);
      return;
    }

    onQuestionIndexChange(questionIndex + 1);
  }

  return (
    <section>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="grid size-11 place-items-center border-2 border-primary bg-primary text-white">
            <Sparkles size={22} />
          </div>
          <h2 className="mt-4 text-2xl font-black leading-tight">
            価値観質問
          </h2>
        </div>
        <InfoButton
          body="価値観質問には、行動を優先順位で並べる質問、複数の選択肢をチェックする質問、短い文章で答える質問があります。1つの質問には1つの回答方式だけが表示されます。すべての質問に回答すると価値観質問が完了します。"
          title="価値観質問の進め方"
        />
      </div>
      <ValueQuestionCard
        answer={currentAnswer}
        onAnswerChange={updateAnswer}
        question={question}
        questionIndex={questionIndex}
        questionTotal={valueQuestions.length}
      />
      <ActionRow>
        {onBack ? (
          <button className="min-h-12 border-2 border-border px-5 font-black" onClick={onBack} type="button">
            戻る
          </button>
        ) : null}
        <button
          className="min-h-12 bg-primary px-5 font-black text-white disabled:bg-surface-alt disabled:text-muted"
          disabled={isLastQuestion ? !canFinishValues : !canGoNext}
          onClick={goNext}
          type="button"
        >
          {isLastQuestion ? "完了" : "次へ"}
        </button>
      </ActionRow>
    </section>
  );
}

function HomeDashboard({ registration }: { registration: RegistrationData }) {
  const blockedItems = levelingItems.filter((item) =>
    registration.blockedLevelingIds.includes(item.id),
  );
  const unansweredQuestions = valueQuestions.filter(
    (question) =>
      !isValueQuestionAnswered(question, registration.values[question.id]),
  );

  return (
    <section className="grid gap-4">
      <div className="border-2 border-border bg-surface p-4 shadow-mono">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center border-2 border-primary bg-primary text-white">
            <Sparkles size={24} />
          </div>
          <div>
            <p className="text-xs font-black uppercase text-muted">Home</p>
            <h1 className="text-xl font-black">Lv. 3 / 会話の種まき</h1>
          </div>
        </div>
        <div className="mt-4 h-4 border-2 border-border bg-surface-alt">
          <div className="h-full w-[58%] bg-primary" />
        </div>
        <p className="mt-3 text-sm leading-6 text-muted">
          {registration.profile.area}周辺で、プロフィールの密度と返信率を高めています。
        </p>
      </div>

      <div className="border-2 border-border bg-surface p-4 shadow-mono">
        <h2 className="text-lg font-black">未達成のレベリング項目</h2>
        <ul className="mt-3 grid gap-3">
          {blockedItems.length > 0 ? (
            blockedItems.map((item, index) => (
              <li className="flex items-center gap-3" key={item.id}>
                <span className="grid size-7 place-items-center border-2 border-primary text-sm font-black">
                  {index + 1}
                </span>
                <span className="text-sm font-bold">{item.title}</span>
              </li>
            ))
          ) : (
            <li className="border-2 border-border bg-surface-alt p-3 text-sm font-black text-muted">
              すべて完了しています
            </li>
          )}
        </ul>
      </div>

      <div className="border-2 border-border bg-surface p-4 shadow-mono">
        <h2 className="text-lg font-black">未回答の価値観質問</h2>
        <ul className="mt-3 grid gap-3">
          {unansweredQuestions.length > 0 ? (
            unansweredQuestions.map((question, index) => (
              <li className="flex items-center gap-3" key={question.id}>
                <span className="grid size-7 place-items-center border-2 border-primary text-sm font-black">
                  {index + 1}
                </span>
                <span className="text-sm font-bold">{question.title}</span>
              </li>
            ))
          ) : (
            <li className="border-2 border-border bg-surface-alt p-3 text-sm font-black text-muted">
              すべて回答済みです
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}

function LevelingHome({
  onResolveItem,
  registration,
}: {
  onResolveItem: (itemId: string) => void;
  registration: RegistrationData;
}) {
  const blockedItems = levelingItems.filter((item) =>
    registration.blockedLevelingIds.includes(item.id),
  );

  if (blockedItems.length > 0) {
    return (
      <section className="grid gap-4">
      <div className="border-2 border-border bg-surface p-4 shadow-mono">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase text-muted">Level lock</p>
            <h2 className="mt-1 text-xl font-black leading-tight">
              未達成の項目を完了してください
            </h2>
          </div>
          <InfoButton
            body="すべて右スワイプできると、レベリング項目は完了です。価値観質問も完了するまでメッセージは利用できません。"
            title="レベリング項目の進め方"
          />
        </div>
      </div>
        <SwipeLevelingDeck
          activeIndex={0}
          items={blockedItems}
          mode="right-only"
          onSwipe={(item, direction) => {
            if (direction === "right") {
              onResolveItem(item.id);
            }
          }}
        />
      </section>
    );
  }

  return (
    <section className="grid gap-4">
      <div className="border-2 border-border bg-surface p-4 shadow-mono">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase text-muted">Leveling</p>
            <h1 className="mt-1 text-xl font-black">レベリング項目の詳細</h1>
          </div>
          <InfoButton
            body="未達成のカードを1枚ずつ確認し、達成できていると思ったら右へ大きくスワイプします。すべて完了すると、レベリング項目は完了扱いになります。"
            title="レベリング項目の実施方法"
          />
        </div>
      </div>

      {levelingItems.map((item, index) => (
        <article
          className="border-2 border-border bg-surface p-4 shadow-mono"
          key={item.id}
        >
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center border-2 border-primary text-sm font-black">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-black leading-tight">{item.title}</h2>
              <dl className="mt-3 grid gap-3 text-sm">
                <div>
                  <dt className="font-black">内容</dt>
                  <dd className="mt-1 leading-6 text-muted">{item.body}</dd>
                </div>
                <div>
                  <dt className="font-black">達成基準</dt>
                  <dd className="mt-1 leading-6 text-muted">
                    {item.criteria}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

function ValuesHome({
  onChange,
  onComplete,
  onQuestionIndexChange,
  questionIndex,
  registration,
  values,
}: {
  onChange: (values: ValueAnswers) => void;
  onComplete: (values: ValueAnswers) => void;
  onQuestionIndexChange: (index: number) => void;
  questionIndex: number;
  registration: RegistrationData;
  values: ValueAnswers;
}) {
  if (registration.valuesCompleted) {
    return (
      <section className="border-2 border-border bg-surface p-5 shadow-mono">
        <div className="grid size-12 place-items-center border-2 border-primary bg-primary text-white">
          <Sparkles size={24} />
        </div>
        <h1 className="mt-4 text-xl font-black">価値観質問は完了しています</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          回答結果はおすすめ相手の推薦や会話のきっかけ作りに利用します。
        </p>
      </section>
    );
  }

  return (
    <div className="border-2 border-border bg-surface p-5 shadow-mono">
      <ValuesStep
        onChange={onChange}
        onComplete={onComplete}
        onQuestionIndexChange={onQuestionIndexChange}
        questionIndex={questionIndex}
        values={values}
      />
    </div>
  );
}

function MessagesHome() {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(initialChatMessages);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  function getCurrentTime() {
    return new Intl.DateTimeFormat("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date());
  }

  function sendMessage() {
    const trimmedDraft = draft.trim();

    if (!trimmedDraft) {
      return;
    }

    const now = Date.now();
    const userMessage: ChatMessage = {
      id: `me-${now}`,
      sender: "me",
      text: trimmedDraft,
      time: getCurrentTime(),
    };
    const replyMessage: ChatMessage = {
      id: `partner-${now}`,
      sender: "partner",
      text: cannedReply,
      time: getCurrentTime(),
    };

    setMessages((currentMessages) => [
      ...currentMessages,
      userMessage,
      replyMessage,
    ]);
    setDraft("");
  }

  return (
    <section className="flex h-[calc(100dvh-48px)] min-h-[420px] flex-col overflow-hidden bg-surface">
      <div className="relative grid min-h-12 shrink-0 place-items-center border-b-2 border-border bg-surface px-12">
        <span className="absolute left-3 grid size-9 place-items-center border-2 border-primary bg-surface-alt text-sm font-black">
          {matchedPartner.name.slice(0, 1)}
        </span>
        <h2 className="max-w-full truncate text-base font-black">
          {matchedPartner.name}
        </h2>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-surface-alt px-3 py-4">
        {messages.map((message) => {
          const isMine = message.sender === "me";

          return (
            <div
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              key={message.id}
            >
              <div
                className={`max-w-[78%] border-2 px-3 py-2.5 ${
                  isMine
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-surface text-text"
                }`}
              >
                <p className="whitespace-pre-wrap text-[15px] font-bold leading-6">
                  {message.text}
                </p>
                <p
                  className={`mt-2 text-right text-[11px] font-bold ${
                    isMine ? "text-white/75" : "text-muted"
                  }`}
                >
                  {message.time}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="shrink-0 border-t-2 border-border bg-surface px-2 py-2">
        <div className="flex items-end gap-2">
          <textarea
            className="max-h-28 min-h-11 min-w-0 flex-1 resize-none border-2 border-border bg-surface-alt px-3 py-2.5 text-base font-bold leading-6 outline-none"
            onChange={(event) => setDraft(event.target.value)}
            placeholder="メッセージを入力"
            rows={1}
            value={draft}
          />
          <button
            className="min-h-11 shrink-0 bg-primary px-4 text-base font-black text-white disabled:bg-surface-alt disabled:text-muted"
            disabled={!draft.trim()}
            onClick={sendMessage}
            type="button"
          >
            送信
          </button>
        </div>
      </div>
    </section>
  );
}

function MessagesLocked() {
  return (
    <section className="border-2 border-border bg-surface p-5 shadow-mono">
      <div className="grid size-12 place-items-center border-2 border-primary bg-surface-alt">
        <MessageCircle size={24} />
      </div>
      <h2 className="mt-4 text-xl font-black">メッセージは準備中です</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        レベリング項目と価値観質問をすべて完了すると利用できます。
      </p>
    </section>
  );
}

function SwipeLevelingDeck({
  activeIndex,
  items,
  mode,
  onSwipe,
}: {
  activeIndex: number;
  items: LevelingItem[];
  mode: "both" | "right-only";
  onSwipe: (item: LevelingItem, direction: SwipeDirection) => void;
}) {
  const visibleItems = items.slice(activeIndex, activeIndex + 3);
  const activeItem = visibleItems[0];
  const [dragX, setDragX] = useState(0);
  const [startX, setStartX] = useState<number | null>(null);
  const threshold = 112;
  const rotation = Math.max(-8, Math.min(8, dragX / 18));
  const decision =
    dragX >= threshold
      ? "right"
      : mode === "both" && dragX <= -threshold
        ? "left"
        : null;

  function finishSwipe(offset: number) {
    setStartX(null);

    if (offset >= threshold) {
      setDragX(0);
      onSwipe(activeItem, "right");
      return;
    }

    if (mode === "both" && offset <= -threshold) {
      setDragX(0);
      onSwipe(activeItem, "left");
      return;
    }

    setDragX(0);
  }

  if (!activeItem) {
    return null;
  }

  return (
    <div className="relative h-[340px] touch-pan-y select-none">
      {visibleItems
        .slice()
        .reverse()
        .map((item, reverseIndex) => {
          const stackIndex = visibleItems.length - 1 - reverseIndex;
          const isActive = stackIndex === 0;
          const offset = stackIndex * 12;
          const scale = 1 - stackIndex * 0.035;

          return (
            <article
              className={`absolute inset-x-0 top-0 grid min-h-[292px] content-between rounded-lg border-2 border-border bg-surface p-5 ${
                isActive ? "cursor-grab shadow-mono active:cursor-grabbing" : ""
              }`}
              key={item.id}
              onPointerCancel={isActive ? () => finishSwipe(dragX) : undefined}
              onPointerDown={
                isActive
                  ? (event) => {
                      setStartX(event.clientX);
                      event.currentTarget.setPointerCapture(event.pointerId);
                    }
                  : undefined
              }
              onPointerMove={
                isActive
                  ? (event) => {
                      if (startX === null) {
                        return;
                      }

                      setDragX(event.clientX - startX);
                    }
                  : undefined
              }
              onPointerUp={isActive ? () => finishSwipe(dragX) : undefined}
              style={{
                transform: isActive
                  ? `translateX(${dragX}px) rotate(${rotation}deg)`
                  : `translateY(${offset}px) scale(${scale})`,
                transition: startX === null ? "transform 180ms ease" : "none",
                zIndex: visibleItems.length - stackIndex,
              }}
            >
              {isActive && decision ? (
                <div
                  className={`absolute top-5 ${
                    decision === "right" ? "right-5" : "left-5"
                  } rounded-md border-2 border-primary bg-surface px-3 py-2 text-xs font-black uppercase`}
                >
                  {decision === "right" ? "Clear" : "Later"}
                </div>
              ) : null}
              <div>
                <p className="text-xs font-black uppercase text-muted">
                  Leveling check
                </p>
                <div className="mt-10 flex items-start justify-between gap-4">
                  <h3 className="text-3xl font-black leading-tight">
                    {item.title}
                  </h3>
                </div>
                <dl className="mt-5 grid gap-4 text-sm">
                  <div>
                    <dt className="font-black">内容</dt>
                    <dd className="mt-1 leading-7 text-muted">{item.body}</dd>
                  </div>
                  <div>
                    <dt className="font-black">達成基準</dt>
                    <dd className="mt-1 leading-7 text-muted">
                      {item.criteria}
                    </dd>
                  </div>
                </dl>
              </div>
            </article>
          );
        })}
      </div>
  );
}

function ValueQuestionCard({
  answer,
  onAnswerChange,
  question,
  questionIndex,
  questionTotal,
}: {
  answer: ValueAnswer;
  onAnswerChange: (answer: ValueAnswer) => void;
  question: ValueQuestion;
  questionIndex: number;
  questionTotal: number;
}) {
  return (
    <div className="value-card relative mt-5 rounded-lg border-2 border-border bg-surface p-5 shadow-mono">
      <div className="value-card-heading mb-5 grid grid-cols-[44px_1fr] items-start gap-3">
        <span className="grid size-11 place-items-center border-2 border-primary bg-primary text-sm font-black text-white">
          Q{questionIndex + 1}
        </span>
        <div>
          <p className="text-xs font-black uppercase text-muted">
            {questionIndex + 1}/{questionTotal}
          </p>
          <h3 className="mt-1 text-xl font-black leading-tight">
            {question.title}
          </h3>
          <p className="mt-2 text-sm font-bold leading-6 text-muted">
            {question.body}
          </p>
        </div>
      </div>
      {question.type === "ranking" && answer.type === "ranking" ? (
        <RankingValueQuestionCard
          answer={answer}
          onAnswerChange={onAnswerChange}
          question={question}
        />
      ) : null}
      {question.type === "checkbox" && answer.type === "checkbox" ? (
        <CheckboxValueQuestionCard
          answer={answer}
          onAnswerChange={onAnswerChange}
          question={question}
        />
      ) : null}
      {question.type === "text" && answer.type === "text" ? (
        <TextValueQuestionCard
          answer={answer}
          onAnswerChange={onAnswerChange}
          question={question}
        />
      ) : null}
    </div>
  );
}

function RankingValueQuestionCard({
  answer,
  onAnswerChange,
  question,
}: {
  answer: Extract<ValueAnswer, { type: "ranking" }>;
  onAnswerChange: (answer: ValueAnswer) => void;
  question: RankingValueQuestion;
}) {
  const currentOrder = answer.order;
  const [draggingOption, setDraggingOption] = useState<string | null>(null);
  const [dragTargetOption, setDragTargetOption] = useState<string | null>(null);
  const [dragGhost, setDragGhost] = useState({
    offsetX: 0,
    offsetY: 0,
    width: 0,
    x: 0,
    y: 0,
  });
  const draggedOption = currentOrder.find((option) => option === draggingOption);

  function moveOption(fromOption: string, toOption: string) {
    if (fromOption === toOption) {
      return;
    }

    const nextOrder = [...currentOrder];
    const fromIndex = nextOrder.indexOf(fromOption);
    const toIndex = nextOrder.indexOf(toOption);

    if (fromIndex < 0 || toIndex < 0) {
      return;
    }

    const [item] = nextOrder.splice(fromIndex, 1);
    nextOrder.splice(toIndex, 0, item);
    onAnswerChange({ type: "ranking", order: nextOrder });
  }

  function handleOptionPointerMove(clientX: number, clientY: number) {
    if (!draggingOption) {
      return;
    }

    setDragGhost((current) => ({ ...current, x: clientX, y: clientY }));

    const target = document
      .elementFromPoint(clientX, clientY)
      ?.closest("[data-choice-id]");
    const targetOption = target?.getAttribute("data-choice-id");

    if (targetOption) {
      setDragTargetOption(targetOption);
      moveOption(draggingOption, targetOption);
    }
  }

  function stopOptionDrag() {
    setDraggingOption(null);
    setDragTargetOption(null);
  }

  return (
    <>
      <ol
        aria-label="価値観の優先順位"
        className="rank-list grid gap-3"
      >
        {currentOrder.map((option, index) => {
          return (
            <li
              className={[
                draggingOption === option ? "is-lifted opacity-35" : "",
                dragTargetOption === option && draggingOption !== option
                  ? "is-drop-target"
                  : "",
                "grid min-h-[72px] select-none grid-cols-[36px_1fr] items-center gap-3",
              ]
                .join(" ")
                .trim()}
              data-choice-id={option}
              key={option}
            >
              <span className="rank-number grid size-9 place-items-center border-2 border-primary bg-surface-alt text-sm font-black">
                {index + 1}
              </span>
              <div
                className="rank-card flex min-h-[60px] touch-none cursor-grab items-center justify-between gap-3 rounded-md border-2 border-border bg-surface-alt px-4 py-3 active:cursor-grabbing"
                onPointerCancel={stopOptionDrag}
                onPointerDown={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();

                  setDraggingOption(option);
                  setDragTargetOption(option);
                  setDragGhost({
                    offsetX: event.clientX - rect.left,
                    offsetY: event.clientY - rect.top,
                    width: rect.width,
                    x: event.clientX,
                    y: event.clientY,
                  });
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                  event.preventDefault();
                  handleOptionPointerMove(event.clientX, event.clientY);
                }}
                onPointerUp={stopOptionDrag}
              >
                <strong className="text-sm font-black leading-6">
                  {option}
                </strong>
                <span
                  aria-hidden="true"
                  className="drag-handle text-lg font-black leading-none text-muted"
                >
                  ≡
                </span>
              </div>
            </li>
          );
        })}
      </ol>
      {draggedOption ? (
        <div
          className="value-drag-ghost pointer-events-none fixed z-50 flex min-h-[60px] items-center justify-between gap-3 rounded-md border-2 border-primary bg-surface px-4 py-3 shadow-mono"
          style={{
            left: `${dragGhost.x - dragGhost.offsetX}px`,
            top: `${dragGhost.y - dragGhost.offsetY}px`,
            width: `${dragGhost.width}px`,
          }}
        >
          <strong className="text-sm font-black leading-6">
            {draggedOption}
          </strong>
          <span
            aria-hidden="true"
            className="drag-handle text-lg font-black leading-none text-muted"
          >
            ≡
          </span>
        </div>
      ) : null}
    </>
  );
}

function CheckboxValueQuestionCard({
  answer,
  onAnswerChange,
  question,
}: {
  answer: Extract<ValueAnswer, { type: "checkbox" }>;
  onAnswerChange: (answer: ValueAnswer) => void;
  question: CheckboxValueQuestion;
}) {
  const maxSelections = question.maxSelections ?? question.options.length;
  const minSelections = question.minSelections ?? 1;

  function toggleOption(option: string) {
    const selected = answer.selected.includes(option)
      ? answer.selected.filter((item) => item !== option)
      : answer.selected.length < maxSelections
        ? [...answer.selected, option]
        : answer.selected;

    onAnswerChange({ type: "checkbox", selected });
  }

  return (
    <div>
      <p className="text-xs font-bold leading-5 text-muted">
        {minSelections}個以上、{maxSelections}個まで選択できます。
      </p>
      <div className="mt-4 grid gap-3">
        {question.options.map((option) => {
          const checked = answer.selected.includes(option);
          const disabled = !checked && answer.selected.length >= maxSelections;

          return (
            <button
              aria-pressed={checked}
              className={`flex min-h-14 items-center gap-3 border-2 px-4 py-3 text-left ${
                checked
                  ? "border-primary bg-primary text-white"
                  : disabled
                    ? "border-border bg-surface-alt text-muted"
                    : "border-border bg-surface-alt text-text"
              }`}
              disabled={disabled}
              key={option}
              onClick={() => toggleOption(option)}
              type="button"
            >
              <span
                className={`grid size-6 shrink-0 place-items-center border-2 text-sm font-black ${
                  checked ? "border-white" : "border-primary"
                }`}
              >
                {checked ? "✓" : ""}
              </span>
              <span className="text-sm font-black leading-6">{option}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TextValueQuestionCard({
  answer,
  onAnswerChange,
  question,
}: {
  answer: Extract<ValueAnswer, { type: "text" }>;
  onAnswerChange: (answer: ValueAnswer) => void;
  question: TextValueQuestion;
}) {
  const maxLength = question.maxLength ?? 240;
  const minLength = question.minLength ?? 1;
  const textLength = answer.text.trim().length;

  return (
    <div>
      <textarea
        className="min-h-36 w-full resize-none border-2 border-border bg-surface-alt p-3 text-sm font-bold leading-6 outline-none"
        maxLength={maxLength}
        onChange={(event) =>
          onAnswerChange({ type: "text", text: event.target.value })
        }
        placeholder={question.placeholder ?? "回答を入力してください"}
        value={answer.text}
      />
      <div className="mt-2 flex items-center justify-between gap-3 text-xs font-bold text-muted">
        <span>{minLength}文字以上</span>
        <span>
          {textLength}/{maxLength}
        </span>
      </div>
    </div>
  );
}

function SettingsHome({
  onReset,
  registration,
}: {
  onReset: () => void;
  registration: RegistrationData;
}) {
  const [feedback, setFeedback] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  function sendFeedback() {
    if (!feedback.trim()) {
      return;
    }

    setFeedback("");
    setFeedbackSent(true);
  }

  return (
    <section className="grid gap-4">
      <div className="border-2 border-border bg-surface p-4 shadow-mono">
        <h2 className="text-lg font-black">設定</h2>
        <dl className="mt-4 grid gap-3 text-sm">
          <InfoRow label="表示名" value={registration.profile.name} />
          <InfoRow label="年齢" value={`${registration.profile.age}歳`} />
          <InfoRow label="性別" value={registration.profile.gender} />
          <InfoRow label="身長" value={`${registration.profile.height}cm`} />
          <InfoRow label="体重" value={`${registration.profile.weight}kg`} />
          <InfoRow label="エリア" value={registration.profile.area} />
          <InfoRow label="沿線" value={registration.profile.trainLine} />
        </dl>
      </div>
      <div className="border-2 border-border bg-surface p-4 shadow-mono">
        <h3 className="font-black">意見箱</h3>
        <p className="mt-2 text-sm leading-6 text-muted">
          使いにくいところ、欲しい機能、違和感などを送信できます。
        </p>
        {feedbackSent ? (
          <p className="mt-3 border-2 border-primary bg-surface-alt p-3 text-sm font-black">
            フィードバックを受け付けました。
          </p>
        ) : null}
        <textarea
          className="mt-4 min-h-28 w-full resize-none border-2 border-border bg-surface-alt p-3 text-sm font-bold leading-6 outline-none"
          onChange={(event) => {
            setFeedback(event.target.value);
            setFeedbackSent(false);
          }}
          placeholder="フィードバックを入力"
          value={feedback}
        />
        <button
          className="mt-3 min-h-12 bg-primary px-4 font-black text-white disabled:bg-surface-alt disabled:text-muted"
          disabled={!feedback.trim()}
          onClick={sendFeedback}
          type="button"
        >
          送信
        </button>
      </div>
      <div className="border-2 border-border bg-surface p-4 shadow-mono">
        <h3 className="font-black">登録フロー確認用</h3>
        <p className="mt-2 text-sm leading-6 text-muted">
          UI検証のため、初回登録状態をリセットできます。
        </p>
        <button
          className="mt-4 inline-flex min-h-12 items-center gap-2 border-2 border-border px-4 font-black"
          onClick={onReset}
          type="button"
        >
          <RotateCcw size={18} />
          初回登録に戻す
        </button>
      </div>
    </section>
  );
}

function FooterNav({
  activeTab,
  messagesEnabled,
  onChange,
}: {
  activeTab: AppTab;
  messagesEnabled: boolean;
  onChange: (tab: AppTab) => void;
}) {
  const tabs = [
    { id: "leveling", label: "レベリング項目", icon: BadgeCheck },
    { id: "values", label: "価値観質問", icon: Sparkles },
    { id: "home", label: "Home", icon: House },
    { id: "messages", label: "メッセージ", icon: MessageCircle },
    { id: "settings", label: "設定", icon: Settings },
  ] as const;

  return (
    <nav className="fixed inset-x-0 bottom-0 border-t-2 border-border bg-surface pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid max-w-[480px] grid-cols-5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          const disabled = tab.id === "messages" && !messagesEnabled;

          return (
            <button
              aria-label={tab.label}
              aria-current={active ? "page" : undefined}
              className={`grid min-h-12 place-items-center px-1 py-2 ${
                active
                  ? "bg-primary text-white"
                  : disabled
                    ? "text-border"
                    : "text-muted"
              }`}
              disabled={disabled}
              key={tab.id}
              onClick={() => onChange(tab.id)}
              type="button"
            >
              <Icon size={22} />
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function InfoButton({ body, title }: { body: string; title: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative shrink-0">
      <button
        aria-label={`${title}の説明`}
        className="grid size-10 place-items-center border-2 border-primary bg-surface-alt text-text"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <Lightbulb size={20} />
      </button>
      {open ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/25 px-4">
          <button
            aria-label="説明の背景を閉じる"
            className="absolute inset-0"
            onClick={() => setOpen(false)}
            type="button"
          />
          <div className="relative max-h-[70dvh] w-full max-w-[420px] overflow-y-auto border-2 border-border bg-surface p-4 shadow-mono">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-black leading-6">{title}</h3>
              <button
                aria-label="説明を閉じる"
                className="grid size-8 shrink-0 place-items-center border-2 border-border bg-surface-alt"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X size={16} />
              </button>
            </div>
            <p className="mt-3 text-sm font-bold leading-6 text-muted">{body}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StepHeader({
  body,
  icon,
  title,
}: {
  body: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <div>
      <div className="grid size-11 place-items-center border-2 border-primary bg-primary text-white">
        {icon}
      </div>
      <h2 className="mt-4 text-2xl font-black leading-tight">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
    </div>
  );
}
function TextField({
  error,
  help,
  inputMode,
  label,
  onChange,
  placeholder,
  suffix,
  value,
}: {
  error?: string;
  help: string;
  inputMode?: "numeric";
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  suffix?: string;
  value: string;
}) {
  return (
    <label className="block">
      <FieldLabel error={error} label={label} />
      <span className="mb-2 block text-xs text-muted">{help}</span>
      <span className="grid grid-cols-[1fr_auto] border-2 border-border bg-surface focus-within:border-primary">
        <input
          className="min-w-0 bg-transparent px-4 py-3 text-base outline-none"
          inputMode={inputMode}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          value={value}
        />
        {suffix ? (
          <span className="grid min-w-12 place-items-center border-l-2 border-border px-3 text-sm font-black text-muted">
            {suffix}
          </span>
        ) : null}
      </span>
    </label>
  );
}

function SelectField({
  error,
  help,
  label,
  onChange,
  options,
  placeholder,
  value,
}: {
  error?: string;
  help: string;
  label: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  value: string;
}) {
  return (
    <label className="block">
      <FieldLabel error={error} label={label} />
      <span className="mb-2 block text-xs text-muted">{help}</span>
      <select
        className="min-h-12 w-full appearance-none border-2 border-border bg-surface px-4 py-3 text-base outline-none focus:border-primary"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function FieldLabel({ error, label }: { error?: string; label: string }) {
  return (
    <span className="mb-1 flex min-h-5 items-baseline gap-2 text-sm font-black">
      <span>{label}</span>
      {error ? <span className="text-xs text-warning">{error}</span> : null}
    </span>
  );
}

function ActionRow({ children }: { children: ReactNode }) {
  return <div className="mt-6 flex justify-end gap-3">{children}</div>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[92px_1fr] gap-3 border-b border-border pb-3 last:border-b-0 last:pb-0">
      <dt className="font-black text-muted">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function getProfileErrors(profile: UserProfile) {
  const height = Number(profile.height);
  const weight = Number(profile.weight);

  return {
    name:
      profile.name.trim().length >= 2
        ? ""
        : "2文字以上で入力してください",
    age: profile.age ? "" : "年齢を選択してください",
    gender: profile.gender ? "" : "性別を選択してください",
    height:
      Number.isFinite(height) && height >= 100 && height <= 230
        ? ""
        : "100〜230cmで入力してください",
    weight:
      Number.isFinite(weight) && weight >= 30 && weight <= 200
        ? ""
        : "30〜200kgで入力してください",
    area: profile.area ? "" : "都道府県を選択してください",
    trainLine: profile.trainLine ? "" : "沿線を選択してください",
  };
}
