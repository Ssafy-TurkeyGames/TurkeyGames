import sys
import locale

print(f"시스템 기본 인코딩: {sys.getdefaultencoding()}")
print(f"로케일 인코딩: {locale.getpreferredencoding()}") 