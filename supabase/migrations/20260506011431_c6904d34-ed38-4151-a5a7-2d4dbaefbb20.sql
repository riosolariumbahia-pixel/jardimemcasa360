-- Corrige assinatura do riosolariumbahia@gmail.com: foi pagamento real (live), foi gravado erradamente como sandbox.
UPDATE public.subscriptions
SET environment = 'live',
    updated_at = now()
WHERE stripe_subscription_id = 'sub_1TSEiAK32ow6QPxWmweVxjhp'
  AND user_id = '93aee94d-e93d-4d5f-b03e-2453bc15017e';