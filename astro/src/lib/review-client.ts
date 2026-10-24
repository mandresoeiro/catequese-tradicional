import { studyRequest, offlineMessage } from './study-client';

interface Question { number: number; slug: string; prompt: string; options: {label: string; text: string}[]; answer: string; explanation: string; reason: string; }
const app = document.querySelector<HTMLElement>('[data-review-mode]');
if (app) {
  const mode = app.dataset.reviewMode!;
  const message = app.querySelector<HTMLElement>('.review-message')!;
  const container = app.querySelector<HTMLElement>('.review-questions')!;
  studyRequest<{total: number; questions: Question[]}>(mode).then(data => {
    message.textContent = data.total ? `${data.questions.length} questões nesta sessão${data.total > data.questions.length ? ', de '+data.total+' pendentes' : ''}.` : 'Nenhuma questão pendente. Continue pelas aulas e volte depois de responder aos questionários.';
    if (!data.questions.length) return;
    const form = document.createElement('form');
    const session = crypto.randomUUID();
    const feedback = new Map<Question, HTMLElement>();
    data.questions.forEach((question,index) => {
      const field = document.createElement('fieldset'); field.className = 'quiz-question';
      const legend = document.createElement('legend'); legend.textContent = `${index+1}. ${question.prompt}`;
      const reason = document.createElement('p'); reason.className = 'muted'; reason.textContent = `${question.slug.replace('aula-','Aula ')} · ${question.reason}`;
      const options = document.createElement('div'); options.className = 'quiz-options';
      question.options.forEach(option => {
        const label = document.createElement('label'); label.className = 'quiz-option';
        const radio = document.createElement('input'); radio.type = 'radio'; radio.name = 'review-'+index; radio.value = option.label;
        const text = document.createElement('span'); text.textContent = `${option.label}. ${option.text}`;
        label.append(radio,text); options.append(label);
      });
      const explanation = document.createElement('div'); explanation.className = 'quiz-feedback'; explanation.hidden = true;
      const answer = document.createElement('p'); answer.textContent = `Resposta: ${question.answer}. ${question.explanation}`;
      const link = document.createElement('a'); link.href = import.meta.env.BASE_URL.replace(/\/$/,'')+'/aulas/'+question.slug+'/'; link.textContent = 'Rever a aula →';
      explanation.append(answer,link); feedback.set(question,explanation); field.append(legend,reason,options,explanation); form.append(field);
    });
    const submit = document.createElement('button'); submit.type = 'submit'; submit.className = 'quiz-primary'; submit.textContent = 'Corrigir e salvar revisão'; form.append(submit); container.append(form);
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const answers = data.questions.flatMap((question,index) => {
        const selected = form.querySelector<HTMLInputElement>(`input[name="review-${index}"]:checked`);
        return selected ? [{slug: question.slug, number: question.number, option: selected.value}] : [];
      });
      if (!answers.length) { message.textContent = 'Marque ao menos uma resposta para corrigir.'; return; }
      submit.disabled = true;
      try {
        await studyRequest('attempts',{mode:'review',session_id:session,answers});
        let correct = 0;
        data.questions.forEach(question => {
          const answer = answers.find(item => item.slug === question.slug && item.number === question.number);
          if (answer?.option === question.answer) correct++;
          feedback.get(question)!.hidden = false;
        });
        form.querySelectorAll<HTMLInputElement>('input').forEach(input => {input.disabled=true;});
        message.textContent = `${correct} acertos em ${answers.length} respostas. Revisão salva no banco pessoal.`;
        submit.textContent = 'Revisão salva';
      } catch { message.textContent = 'Não foi possível salvar. Suas respostas continuam marcadas; tente novamente.'; submit.disabled=false; }
    });
  }).catch(() => { message.textContent = offlineMessage; });
}
