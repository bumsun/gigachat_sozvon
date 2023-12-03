# Решение команды Mountaind Heads для хакатона Phystech GigaChat Challenge

[Sozvon.pro](https://sozvon.pro) — платформа, которая облегчает экспертам взаиморасчёты с клиентами за проведённые онлайн-консультации. Для клиентов сервис — удобный инструмент для поиска эксперта, общения с ним и оплаты — всё это происходит на одной платформе.

По [cсылке](sozvon_prez.pdf) можно изучить подробную презентацию сервиса

Реализовали в рамках хакатона в сервисе sozvon.pro:
- чат с ботом-экспертом. Бот сам пишет новому пользователю, спрашивает о его целях на платформе, присылает ему учебные материалы и задачки. 
- генерацию текста и картинок для постов в разделе “Блоги”.

## AI помощник для написания статей и генерации картинок

Видео демонстрация работы AI помощника по написанию статей и возможность быстрой авторизации в роли эксперта через ссылку.
[Ссылка](https://sozvon.pro/create_blog_post?token=dZQs8EmuTrOUixSggg831685183100270) для быстрого тестирования написания статей.

[![Watch the video](https://img.youtube.com/vi/oABQIBIhDxc/sddefault.jpg)](https://www.youtube.com/watch?v=oABQIBIhDxc)

Видео демонстрирует работу подсказок при написании статей
[![Watch the video](https://img.youtube.com/vi/OZJERyUyuA8/sddefault.jpg)](https://www.youtube.com/watch?v=OZJERyUyuA8)

По [cсылке](https://github.com/bumsun/gigachat_sozvon/blob/main/CreateBlogPost.js) можно ознакомиться с React JS кодом, который отвечает за умное написание статей.

## AI репетитор, который по сценарию и взаимодействию с Gigachat обучает пользователей программированию

Видео демонстрирует работу бота и возможность быстрой авторизации.
[![Watch the video](https://img.youtube.com/vi/GO-So4dMPqQ/sddefault.jpg)](https://www.youtube.com/watch?v=GO-So4dMPqQ)

По [cсылке](https://github.com/bumsun/gigachat_sozvon/blob/main/gigachat_bot.js) можно ознакомиться с Node JS кодом, который отвечает за поведение бота.

Ниже представлена логика работы реализованного AI бота.
![block_diagram](block_diagram.jpg)

